import { useState, useEffect, useRef } from 'react';

export function useInterview(onEnd) {
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
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    // --- 2. The Interview Logic Cycle ---
    // This effect runs whenever isAISpeaking changes to manage the "Speak -> Listen" flow
    useEffect(() => {
        if (!isRecording) return;

        const runCycle = async () => {
            if (isAISpeaking) {
                // AI is "Speaking" the current transcriptText
                setCaptionVisible(true);
                // Wait 5 seconds (simulating AI speech time)
                await new Promise(res => setTimeout(res, 5000));
                setIsAISpeaking(false); // Switch to listening mode
            } else {
                // AI starts "Listening"
                startAnswerCapture();
                // Wait 6 seconds for user to speak
                await new Promise(res => setTimeout(res, 6000));
                stopAnswerCapture(); // This triggers sendAnswerToServer
            }
        };

        runCycle();
    }, [isRecording, isAISpeaking]);

    // --- 3. Recording "Answer Slices" (Task 2) ---
    const startAnswerCapture = () => {
        if (!streamRef.current || !streamRef.current.active) return;
        if (answerRecorderRef.current?.state === 'recording') return;

        currentAnswerChunks.current = [];
        try {
            const clonedStream = streamRef.current.clone();
            const recorder = new MediaRecorder(clonedStream);
            answerRecorderRef.current = recorder;
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) currentAnswerChunks.current.push(e.data);
            };
            
            recorder.onstop = async () => {
                const audioBlob = new Blob(currentAnswerChunks.current, { type: 'audio/webm' });
                sendAnswerToServer(audioBlob);
                clonedStream.getTracks().forEach(track => track.stop());
            };
            
            recorder.start();
            console.log("🎤 Recording answer...");
        } catch (err) {
            console.error("Capture Error:", err);
        }
    };

    const stopAnswerCapture = () => {
        if (answerRecorderRef.current?.state === 'recording') {
            answerRecorderRef.current.stop();
        }
    };

    // --- 4. Server Communication ---
    const sendAnswerToServer = async (blob) => {
        const formData = new FormData();
        formData.append('audio', blob, 'answer.webm');
        formData.append('session_id', sessionStorage.getItem('session_id'));

        try {
            console.log("📤 Sending to backend...");
            // const response = await fetch('http://localhost:8000/transcribe', {
            //     method: 'POST',
            //     body: formData
            // });
            // const data = await response.json();
            const data = { next_question: "What was the biggest challenge you faced?" }; // Mock response for testing
            console.log("📥 Received from backend:", data);

            if (data.next_question) {
                // UPDATE: Store new question and trigger "Speaking" phase again
                sessionStorage.setItem('current_question', data.next_question);
                setTranscriptText(data.next_question);
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