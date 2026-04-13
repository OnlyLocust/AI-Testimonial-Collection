import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useInterview(onEnd) {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(true);
    const [transcriptText, setTranscriptText] = useState("");
    const [captionVisible, setCaptionVisible] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [cameraError, setCameraError] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    // --- New states for error handling & retry UX ---
    const [retryMessage, setRetryMessage] = useState(null);   // "retry" status message
    const [networkError, setNetworkError] = useState(false);  // true → show Reconnect button

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fullRecorderRef = useRef(null);
    const fullVideoChunks = useRef([]);
    const answerRecorderRef = useRef(null);
    const currentAnswerChunks = useRef([]);

    const answerSilenceTimerRef = useRef(null);
    const answerMaxTimerRef = useRef(null);
    const vadAnimationFrameRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const vadStateRef = useRef({ lastSpeechTime: 0, startedAt: 0 });

    // Stable reference to the latest blob — used by the reconnect flow
    const lastBlobRef = useRef(null);

    // --- 1. Initial Load & Camera Start ---
    useEffect(() => {
        let mounted = true;

        async function verifySessionAndStart() {
            const currentSessionId = sessionStorage.getItem('current_session_id');
            if (currentSessionId) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-session/${currentSessionId}`);
                    const data = await res.json();

                    if (data.status === "expired" || data.status === "invalid") {
                        console.warn("Orphaned / expired session found, clearing and redirecting.");
                        sessionStorage.removeItem('current_session_id');
                        sessionStorage.removeItem('current_question');
                        router.push("/");
                        return;
                    }

                    // ✅ Clock sync: restore server-authoritative time on refresh
                    if (typeof data.time_remaining === 'number') {
                        setTimeRemaining(data.time_remaining);
                    }

                    // ✅ Restore current question if present
                    if (data.current_question) {
                        sessionStorage.setItem('current_question', data.current_question);
                    }
                } catch (err) {
                    console.error("Error verifying session:", err);
                }
            }

            // Load the very first question from sessionStorage immediately
            const firstQuestion = sessionStorage.getItem('current_question');
            if (firstQuestion) setTranscriptText(firstQuestion);

            await startCamera();
        }

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true,
                });
                if (!mounted) return stream.getTracks().forEach(t => t.stop());

                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;

                // Start Full Recording
                const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
                fullRecorderRef.current = recorder;
                recorder.ondataavailable = (e) => { if (e.data.size > 0) fullVideoChunks.current.push(e.data); };
                recorder.start();

                setIsRecording(true);
            } catch (err) {
                if (mounted) setCameraError(err.name === 'NotAllowedError' ? 'Access Denied' : 'Camera Error');
            }
        }

        verifySessionAndStart();
        return () => {
            mounted = false;
            fullRecorderRef.current?.stop();
            answerRecorderRef.current?.stop();
            if (answerMaxTimerRef.current) clearTimeout(answerMaxTimerRef.current);
            if (answerSilenceTimerRef.current) clearTimeout(answerSilenceTimerRef.current);
            if (vadAnimationFrameRef.current) cancelAnimationFrame(vadAnimationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    const speakText = (text) => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.warn("Speech synthesis not supported");
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 20;
            utterance.volume = 3;

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes("en"));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    // --- 2. The Interview Logic Cycle ---
    useEffect(() => {
        if (!isRecording) return;

        const runCycle = async () => {
            if (isAISpeaking) {
                setCaptionVisible(true);
                await speakText(transcriptText);
                setIsAISpeaking(false);
            } else {
                startAnswerCapture();
                // Maximum listen time fallback (30s)
                answerMaxTimerRef.current = setTimeout(() => {
                    stopAnswerCapture();
                }, 30000);
            }
        };

        runCycle();
    }, [isRecording, isAISpeaking]);

    // --- 3. Recording "Answer Slices" ---
    const startAnswerCapture = () => {
        if (!streamRef.current || !streamRef.current.active) return;
        if (answerRecorderRef.current?.state === 'recording') return;

        currentAnswerChunks.current = [];
        vadStateRef.current = { lastSpeechTime: performance.now(), startedAt: performance.now() };

        try {
            const clonedStream = streamRef.current.clone();
            const recorder = new MediaRecorder(clonedStream);
            answerRecorderRef.current = recorder;

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(clonedStream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.fftSize);
            const silenceThreshold = 0.02;
            const silenceLimitMs = 5000;

            const checkVoiceActivity = () => {
                analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const normalized = (dataArray[i] - 128) / 128;
                    sum += normalized * normalized;
                }
                const rms = Math.sqrt(sum / dataArray.length);
                const now = performance.now();

                if (rms > silenceThreshold) {
                    vadStateRef.current.lastSpeechTime = now;
                }

                if (now - vadStateRef.current.lastSpeechTime > silenceLimitMs) {
                    stopAnswerCapture();
                    return;
                }

                vadAnimationFrameRef.current = requestAnimationFrame(checkVoiceActivity);
            };

            vadAnimationFrameRef.current = requestAnimationFrame(checkVoiceActivity);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) currentAnswerChunks.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(currentAnswerChunks.current, { type: 'audio/webm' });
                lastBlobRef.current = audioBlob; // store for reconnect path
                sendAnswerToServer(audioBlob);
                clonedStream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            console.log("🎤 Recording answer with silence auto-stop...");
        } catch (err) {
            console.error("Capture Error:", err);
        }
    };

    const stopAnswerCapture = () => {
        if (answerMaxTimerRef.current) {
            clearTimeout(answerMaxTimerRef.current);
            answerMaxTimerRef.current = null;
        }
        if (answerSilenceTimerRef.current) {
            clearTimeout(answerSilenceTimerRef.current);
            answerSilenceTimerRef.current = null;
        }
        if (vadAnimationFrameRef.current) {
            cancelAnimationFrame(vadAnimationFrameRef.current);
            vadAnimationFrameRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }

        if (answerRecorderRef.current?.state === 'recording') {
            answerRecorderRef.current.stop();
        }
    };

    // --- 4. Server Communication ---
    const sendAnswerToServer = async (blob) => {
        setNetworkError(false); // clear any previous network error

        // ── Step 1: Transcribe ──
        let transcript = "";
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'answer.webm');

            console.log("📤 Sending to backend...");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transcribe`, {
                method: 'POST',
                body: formData
            });
            const text = await res.json();
            transcript = text.transcript ?? "";
            console.log("Transcript:", transcript);
        } catch (err) {
            console.error("Transcription network error:", err);
            setNetworkError(true);
            return; // stop here — Reconnect button will re-trigger
        }

        // ── Step 2: Next question ──
        try {
            const sendData = {
                session_id: sessionStorage.getItem('current_session_id'),
                answer: transcript,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/next-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sendData),
            });
            const data = await response.json();
            console.log("📥 Received from backend:", data);

            // ── Clock sync: always update from server ──
            if (typeof data.time_remaining === 'number') {
                setTimeRemaining(data.time_remaining);
            }

            // ── Handle status ──
            if (data.status === "complete") {
                setRetryMessage(null);
                setTranscriptText("Thank you for your time! The interview is now complete. We are generating your testimonial...");
                setIsAISpeaking(true);

                const synthPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/synthesize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionStorage.getItem('current_session_id') }),
                })
                .then(r => r.json())
                .then(bundle => {
                    sessionStorage.setItem('testimonial_bundle', JSON.stringify(bundle));
                })
                .catch(e => console.error("Synthesis error:", e));

                const redirectTimer = new Promise(resolve => setTimeout(resolve, 5000));
                await Promise.all([synthPromise, redirectTimer]);
                router.push("/testimonial");
                return;
            }

            if (data.status === "retry") {
                // Show neon warning toast — do NOT advance the question
                setRetryMessage(data.message);
                // Re-enter listening mode immediately
                setIsAISpeaking(false);
                startAnswerCapture();
                answerMaxTimerRef.current = setTimeout(() => stopAnswerCapture(), 30000);
                return;
            }

            if (data.question) {
                setRetryMessage(null); // clear any previous retry warning
                sessionStorage.setItem('current_question', data.question);
                setTranscriptText(data.question);
                setIsAISpeaking(true);
            }
        } catch (err) {
            console.error("Next-question network error:", err);
            setNetworkError(true);
        }
    };

    // Reconnect: re-attempt with the last recorded blob
    const handleReconnect = useCallback(() => {
        if (lastBlobRef.current) {
            setNetworkError(false);
            sendAnswerToServer(lastBlobRef.current);
        }
    }, []);
    useEffect(() => {
        if (isFinished) {
            // Now it's safe to navigate or call onEnd
            onEnd(fullVideoChunks.current);
            router.push("/testimonial"); 
        }
    }, [isFinished, router, onEnd]);
    // --- 5. Global Timer — syncs to server after each response ---
    useEffect(() => {
        if (!isRecording) return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsFinished(true); // <--- Set this instead of calling onEnd
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRecording]);

    return {
        videoRef, isRecording, isAISpeaking, transcriptText,
        captionVisible, timeRemaining, cameraError, streamRef,
        retryMessage, networkError, handleReconnect,
    };
}