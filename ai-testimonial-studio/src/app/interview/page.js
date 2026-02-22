'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── Sample AI questions rotated as "transcript" ──────────────────────────────
const AI_QUESTIONS = [
    'Tell me about your experience. What made it truly special?',
    'How has this changed the way you work or live day-to-day?',
    'What would you say to someone who\'s on the fence about trying it?',
    'What\'s the one word you\'d use to describe the whole experience?',
];

// ─── Format seconds → MM:SS ───────────────────────────────────────────────────
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function InterviewPage() {
    const router = useRouter();

    // ── State ──────────────────────────────────────────────────────────────────
    const [isRecording, setIsRecording] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(true);
    const [transcriptText, setTranscriptText] = useState(AI_QUESTIONS[0]);
    const [captionVisible, setCaptionVisible] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [cameraError, setCameraError] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const questionCycleRef = useRef(null);

    // ── Camera initialisation ──────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true,
                });
                if (!mounted) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsRecording(true);
            } catch (err) {
                if (mounted) {
                    setCameraError(
                        err.name === 'NotAllowedError'
                            ? 'Camera access was denied. Please allow camera permissions and reload.'
                            : 'Unable to access camera. Please check your device settings.'
                    );
                }
            }
        }

        startCamera();

        return () => {
            mounted = false;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            clearInterval(timerRef.current);
            clearInterval(questionCycleRef.current);
        };
    }, []);

    // ── Countdown timer ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isRecording) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleEndInterview();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── AI question cycling: speaking → listening → next question ──────────────
    useEffect(() => {
        if (!isRecording) return;

        // Simulate: AI speaks for 4s, then listens for 6s, then next question
        let speakTimer, listenTimer;

        function nextCycle(index) {
            setIsAISpeaking(true);
            setCaptionVisible(false);

            setTimeout(() => {
                setTranscriptText(AI_QUESTIONS[index % AI_QUESTIONS.length]);
                setCaptionVisible(true);
            }, 300); // let old caption fade out first

            speakTimer = setTimeout(() => {
                setIsAISpeaking(false); // now listening

                listenTimer = setTimeout(() => {
                    setQuestionIndex((prev) => {
                        const next = (prev + 1) % AI_QUESTIONS.length;
                        nextCycle(next);
                        return next;
                    });
                }, 6000);
            }, 4000);
        }

        nextCycle(questionIndex);

        return () => {
            clearTimeout(speakTimer);
            clearTimeout(listenTimer);
        };
    }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── End interview handler ──────────────────────────────────────────────────
    function handleEndInterview() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        router.push('/preview');
    }

    // ── Camera permission error screen ────────────────────────────────────────
    if (cameraError) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
                style={{ backgroundColor: '#0F0F14' }}
            >
                <div
                    className="text-5xl"
                    aria-hidden="true"
                >
                    🎥
                </div>
                <h2 className="text-2xl font-bold text-white">Camera Access Required</h2>
                <p style={{ color: '#9ca3af' }} className="max-w-sm text-base leading-relaxed">
                    {cameraError}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ── Main interview layout ──────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: '#0F0F14' }}
        >
            {/* ── Top header bar ── */}
            <header
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <span
                    className="text-sm font-semibold tracking-widest uppercase"
                    style={{ color: '#7c3aed' }}
                >
                    AI Testimonial Studio
                </span>

                {/* Live badge */}
                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: '#ef4444' }}
                    />
                    <span className="text-xs font-medium" style={{ color: '#f87171' }}>
                        LIVE
                    </span>
                </div>
            </header>

            {/* ── Main content: AI panel (30%) + Camera (70%) ── */}
            <div className="flex flex-1 gap-4 px-4 pt-4 lg:flex-row flex-col">

                {/* ── LEFT: AI Avatar Panel ── */}
                <div
                    className="lg:w-[30%] w-full flex flex-col items-center justify-center rounded-2xl p-6 gap-6 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        minHeight: '300px',
                    }}
                >
                    {/* Ambient orb behind avatar */}
                    <div
                        aria-hidden="true"
                        className="absolute rounded-full blur-3xl"
                        style={{
                            width: '200px',
                            height: '200px',
                            background: isAISpeaking
                                ? 'radial-gradient(circle, rgba(124,58,237,0.5), transparent)'
                                : 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)',
                            transition: 'background 1s ease',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />

                    {/* Avatar circle */}
                    <div
                        className="relative rounded-full flex items-center justify-center"
                        style={{
                            width: '120px',
                            height: '120px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                            boxShadow: isAISpeaking
                                ? '0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.2)'
                                : '0 0 20px rgba(59,130,246,0.3)',
                            transition: 'box-shadow 0.8s ease',
                        }}
                    >
                        {/* Sound wave rings when speaking */}
                        {isAISpeaking && (
                            <>
                                <span
                                    className="absolute rounded-full border-2 animate-ping"
                                    style={{
                                        width: '140px',
                                        height: '140px',
                                        borderColor: 'rgba(124,58,237,0.4)',
                                        animationDuration: '1.2s',
                                    }}
                                />
                                <span
                                    className="absolute rounded-full border-2 animate-ping"
                                    style={{
                                        width: '165px',
                                        height: '165px',
                                        borderColor: 'rgba(124,58,237,0.2)',
                                        animationDuration: '1.8s',
                                        animationDelay: '0.3s',
                                    }}
                                />
                            </>
                        )}

                        {/* AI face icon */}
                        <svg
                            width="52"
                            height="52"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            <circle cx="8.5" cy="7.5" r="0.5" fill="white" />
                            <circle cx="15.5" cy="7.5" r="0.5" fill="white" />
                        </svg>
                    </div>

                    {/* AI name + state label */}
                    <div className="text-center z-10">
                        <p className="text-white font-semibold text-base">Alex</p>
                        <p className="text-xs mt-1 font-medium tracking-wide" style={{ color: '#a78bfa' }}>
                            AI Interviewer
                        </p>

                        {/* Speaking / Listening badge */}
                        <div
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                                background: isAISpeaking
                                    ? 'rgba(124,58,237,0.2)'
                                    : 'rgba(34,197,94,0.15)',
                                border: isAISpeaking
                                    ? '1px solid rgba(124,58,237,0.4)'
                                    : '1px solid rgba(34,197,94,0.4)',
                                color: isAISpeaking ? '#c4b5fd' : '#86efac',
                                transition: 'all 0.4s ease',
                            }}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                    backgroundColor: isAISpeaking ? '#a78bfa' : '#4ade80',
                                    display: 'inline-block',
                                    animation: 'pulse 1.5s infinite',
                                }}
                            />
                            {isAISpeaking ? 'AI Speaking' : 'Listening…'}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Camera Preview ── */}
                <div
                    className="lg:w-[70%] w-full relative rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        minHeight: '300px',
                    }}
                >
                    {/* Video element */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ minHeight: '300px', borderRadius: 'inherit' }}
                    />

                    {/* Camera loading state */}
                    {!isRecording && !cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                                    style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }}
                                />
                                <span className="text-sm" style={{ color: '#9ca3af' }}>
                                    Starting camera…
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Recording dot overlay */}
                    {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5"
                            style={{
                                background: 'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(239,68,68,0.4)',
                            }}
                        >
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: '#ef4444' }}
                            />
                            <span className="text-xs font-semibold" style={{ color: '#fca5a5' }}>
                                REC
                            </span>
                        </div>
                    )}

                    {/* Timer overlay — bottom left of video */}
                    <div
                        className="absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-sm font-mono font-bold"
                        style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            color: timeRemaining <= 15 ? '#f87171' : '#e5e7eb',
                            border: timeRemaining <= 15
                                ? '1px solid rgba(239,68,68,0.5)'
                                : '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {formatTime(timeRemaining)}
                    </div>
                </div>
            </div>

            {/* ── Caption / Transcript area ── */}
            <div
                className="px-4 py-6 flex items-center justify-center"
                style={{ minHeight: '90px' }}
            >
                <p
                    className="text-center text-xl sm:text-2xl font-semibold max-w-2xl leading-snug transition-all duration-500"
                    style={{
                        color: captionVisible ? '#f3f4f6' : 'transparent',
                        transform: captionVisible ? 'translateY(0)' : 'translateY(8px)',
                        textShadow: '0 0 30px rgba(167,139,250,0.3)',
                    }}
                >
                    {transcriptText}
                </p>
            </div>

            {/* ── Control Bar ── */}
            <footer
                className="flex items-center justify-between px-6 py-5 gap-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
                {/* Left: countdown */}
                <div className="flex flex-col items-center min-w-[72px]">
                    <span
                        className="text-2xl font-mono font-bold tabular-nums"
                        style={{ color: timeRemaining <= 15 ? '#f87171' : '#e5e7eb' }}
                    >
                        {formatTime(timeRemaining)}
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                        remaining
                    </span>
                </div>

                {/* Centre: status */}
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: isAISpeaking ? '#a78bfa' : '#4ade80' }}
                    />
                    <span
                        className="text-sm font-medium tracking-wide"
                        style={{ color: isAISpeaking ? '#c4b5fd' : '#86efac' }}
                    >
                        {isAISpeaking ? 'AI Speaking…' : 'Listening to you…'}
                    </span>
                </div>

                {/* Right: End Interview button */}
                <button
                    id="end-interview-btn"
                    onClick={handleEndInterview}
                    className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        boxShadow: '0 0 20px rgba(124,58,237,0.35)',
                    }}
                >
                    End Interview
                </button>
            </footer>
        </div>
    );
}
