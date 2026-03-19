import { useState, useEffect, useRef } from 'react';

export function useInterview(questions, onEnd) {
    const [isRecording, setIsRecording] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(true);
    const [transcriptText, setTranscriptText] = useState(questions[0]);
    const [captionVisible, setCaptionVisible] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [cameraError, setCameraError] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    
    // Task 1: Full Video Refs
    const fullRecorderRef = useRef(null);
    const fullVideoChunks = useRef([]);

    // Task 2: Q&A Answer Refs
    const answerRecorderRef = useRef(null);
    const currentAnswerChunks = useRef([]);

    // --- 1. Camera Initialization ---
    useEffect(() => {
        let mounted = true;
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true,
                });
                if (!mounted) return stream.getTracks().forEach(t => t.stop());
                
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                
                // Start Task 1: The Full Recording
                startFullRecording(stream);
                
                setIsRecording(true);
            } catch (err) {
                if (mounted) setCameraError(err.name === 'NotAllowedError' ? 'Access Denied' : 'Camera Error');
            }
        }
        startCamera();
        return () => {
            mounted = false;
            stopAllRecording();
        };
    }, []);

    // --- 2. Full Video Logic (Task 1) ---
    const startFullRecording = (stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
        fullRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) fullVideoChunks.current.push(e.data);
        };
        recorder.start();
    };

    const stopAllRecording = () => {
        fullRecorderRef.current?.stop();
        answerRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach(t => t.stop());
    };

    // --- 3. Speech-to-Text Logic (Task 2) ---
    // --- 1. Update the Answer Capture to use a Clone ---
const startAnswerCapture = () => {
    // Safety check: Don't start if already recording or stream lost
    if (!streamRef.current || !streamRef.current.active) return;
    if (answerRecorderRef.current && answerRecorderRef.current.state !== 'inactive') return;

    currentAnswerChunks.current = [];
    
    try {
        // CLONE THE STREAM: This is the magic fix
        const clonedStream = streamRef.current.clone();
        
        // Use standard settings
        const recorder = new MediaRecorder(clonedStream);
        answerRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) currentAnswerChunks.current.push(e.data);
        };
        
        recorder.onstop = async () => {
            const audioBlob = new Blob(currentAnswerChunks.current, { type: 'audio/webm' });
            sendAnswerToServer(audioBlob);
            
            // CLEAN UP: Stop the cloned tracks to save CPU/Memory
            clonedStream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        console.log("🎤 Cloned stream recording started...");
    } catch (err) {
        console.error("Critical Recorder Error:", err);
    }
};

// --- 2. Update the Stop function to be safer ---
const stopAnswerCapture = () => {
    if (answerRecorderRef.current && answerRecorderRef.current.state === 'recording') {
        answerRecorderRef.current.stop();
        console.log("🛑 Stopped answer capture.");
    }
};

    const sendAnswerToServer = async (blob) => {
        const formData = new FormData();
        formData.append('audio', blob, 'answer.webm');
        console.log("📤 Prepared audio blob for upload:", blob);

        // uncomment this when calling real server

        // try {
        //     const response = await fetch('YOUR_SERVER_URL/transcribe', {
        //         method: 'POST',
        //         body: formData
        //     });
        //     const data = await response.json();
        //     console.log("📝 Transcription received:", data.text);
        // } catch (err) {
        //     console.error("Failed to send audio to server", err);
        // }
    };

    // --- 4. AI Question Cycle & Timer ---
    useEffect(() => {
        if (!isRecording) return;
        let speakTimer, listenTimer;

        function nextCycle(index) {
            // AI START SPEAKING
            setIsAISpeaking(true);
            setCaptionVisible(false);
            
            setTimeout(() => {
                setTranscriptText(questions[index % questions.length]);
                setCaptionVisible(true);
            }, 300);

            // After 4s of AI speaking, AI stops and listens
            speakTimer = setTimeout(() => {
                setIsAISpeaking(false);
                
                // START capturing the answer chunk
                startAnswerCapture();

                // Listen for 6 seconds (or until pause)
                listenTimer = setTimeout(() => {
                    // STOP capturing the answer chunk (this triggers upload)
                    stopAnswerCapture();

                    setQuestionIndex(prev => {
                        const next = (prev + 1) % questions.length;
                        nextCycle(next);
                        return next;
                    });
                }, 6000); 
            }, 4000);
        }

        nextCycle(questionIndex);
        return () => { clearTimeout(speakTimer); clearTimeout(listenTimer); };
    }, [isRecording]);

    // Timer Logic
    useEffect(() => {
        if (!isRecording) return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onEnd(fullVideoChunks.current); // Pass data to end handler
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRecording, onEnd]);

    return { 
        videoRef, isRecording, isAISpeaking, transcriptText, 
        captionVisible, timeRemaining, cameraError, streamRef,
        fullVideoChunks 
    };
}