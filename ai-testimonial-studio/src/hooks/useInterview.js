import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useInterview(onEnd) {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(true);
    const [transcriptText, setTranscriptText] = useState("");
    const [captionVisible, setCaptionVisible] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [cameraError, setCameraError] = useState(null);

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

    // --- 1. Initial Load & Camera Start ---
    useEffect(() => {
        let mounted = true;
        
        // Load the very first question from localStorage immediately
        const firstQuestion = sessionStorage.getItem('current_question');
        if (firstQuestion) setTranscriptText(firstQuestion);

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true,
                });
                if (!mounted) return stream.getTracks().forEach(t => t.stop());
                
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                
                // Start Full Recording (Task 1)
                const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
                fullRecorderRef.current = recorder;
                recorder.ondataavailable = (e) => { if (e.data.size > 0) fullVideoChunks.current.push(e.data); };
                recorder.start();
                
                setIsRecording(true);
            } catch (err) {
                if (mounted) setCameraError(err.name === 'NotAllowedError' ? 'Access Denied' : 'Camera Error');
            }
        }
        startCamera();
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

            // Optional tuning
            utterance.rate = 0.8;      // speed (0.5 - 2)
            utterance.pitch = 20;     // voice pitch
            utterance.volume = 3;    // volume

            // Choose a voice (optional but nice)
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes("en"));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => {
                resolve(); // when AI finishes speaking
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // --- 2. The Interview Logic Cycle ---
    // This effect runs whenever isAISpeaking changes to manage the "Speak -> Listen" flow
    useEffect(() => {
        if (!isRecording) return;

        const runCycle = async () => {
            if (isAISpeaking) {
                // AI is "Speaking" the current transcriptText
                setCaptionVisible(true);
                // Wait 5 seconds (simulating AI speech time)
                // await new Promise(res => setTimeout(res, 5000));
                await speakText(transcriptText);
                setIsAISpeaking(false); // Switch to listening mode
            } else {
                // AI starts "Listening"
                startAnswerCapture();
                // Maximum listen time fallback (30s)
                answerMaxTimerRef.current = setTimeout(() => {
                    stopAnswerCapture();
                }, 30000);
            }
        };

        runCycle();
    }, [isRecording, isAISpeaking]);

    // --- 3. Recording "Answer Slices" (Task 2) ---
    const startAnswerCapture = () => {
        if (!streamRef.current || !streamRef.current.active) return;
        if (answerRecorderRef.current?.state === 'recording') return;

        currentAnswerChunks.current = [];
        vadStateRef.current = { lastSpeechTime: performance.now(), startedAt: performance.now() };

        try {
            const clonedStream = streamRef.current.clone();
            const recorder = new MediaRecorder(clonedStream);
            answerRecorderRef.current = recorder;

            // Setup VAD (silence detection) from cloned audio stream
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(clonedStream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.fftSize);
            const silenceThreshold = 0.02; // adjust as needed
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
        const formData = new FormData();
        formData.append('audio', blob, 'answer.webm');
        formData.append('session_id', sessionStorage.getItem('current_session_id'));

        try {
            console.log("📤 Sending to backend...");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transcribe`, {
                method: 'POST',
                body: formData
            });
            const text = await res.json();

            console.log(text.transcript);
            

            const sendData = {
                session_id: sessionStorage.getItem('current_session_id'),
                answer:text.transcript ,
            }

            console.log(sendData);
            

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/next-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sendData),
            });
            const data = await response.json();
            // const data = { next_question: "What was the biggest challenge you faced?" }; // Mock response for testing
            console.log("📥 Received from backend:", data);
            if(data.status === "complete") {
                setTranscriptText("Thank you for your time! The interview is now complete.");
                setIsAISpeaking(true);
                // alert("Interview complete: " + data.message);
                setTimeout(() => {
                    router.push("/testimonial");
                }, 5000);
                return;
            }
            if (data.question) {
                // UPDATE: Store new question and trigger "Speaking" phase again
                sessionStorage.setItem('current_question', data.question);
                setTranscriptText(data.question);
                setIsAISpeaking(true);
            }
        } catch (err) {
            console.error("Server Error:", err);
            // Fallback: If server fails, just move to a generic next step
            setIsAISpeaking(true);
        }
    };

    // --- 5. Global Timer ---
    useEffect(() => {
        if (!isRecording) return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onEnd(fullVideoChunks.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRecording, onEnd]);

    return { 
        videoRef, isRecording, isAISpeaking, transcriptText, 
        captionVisible, timeRemaining, cameraError, streamRef 
    };
}