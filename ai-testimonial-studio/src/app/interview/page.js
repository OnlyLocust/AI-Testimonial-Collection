'use client';

import { useRouter } from 'next/navigation';
import { useInterview } from '@/hooks/useInterview';
import { formatTime } from '@/lib/utils';

// Sub-components
import HeaderBar from '@/components/interview/HeaderBar';
import AIAvatar from '@/components/interview/AIAvatar';
import CameraPreview from '@/components/interview/CameraPreview';
import CameraError from '@/components/interview/CameraError';

export default function InterviewPage() {
    const router = useRouter();

    const {
        videoRef,
        isRecording,
        isAISpeaking,
        transcriptText,
        captionVisible,
        timeRemaining,
        cameraError,
        streamRef,
        retryMessage,
        networkError,
        handleReconnect,
    } = useInterview(() => router.push('/testimonial')); //preview

    if (cameraError) return <CameraError cameraError={cameraError} />;

    const handleEnd = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        router.push('/testimonial'); //preview
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0F0F14]">
            {/* Top Navigation / Progress Bar */}
            <HeaderBar />

            <main className="flex flex-1 gap-4 px-4 pt-4 lg:flex-row flex-col">
                {/* Left Side: AI Character Alex */}
                <AIAvatar isAISpeaking={isAISpeaking} />

                {/* Right Side: User's Camera Feed */}
                <CameraPreview
                    videoRef={videoRef}
                    isRecording={isRecording}
                    timeRemaining={timeRemaining}
                    formatTime={formatTime}
                />
            </main>

            {/* Transcription / Question Area */}
            <div className="px-4 py-8 flex justify-center min-h-30">
                <p
                    className={`text-xl sm:text-2xl font-semibold text-center transition-all duration-500 max-w-3xl leading-relaxed
                    ${captionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    ${isAISpeaking ? 'text-purple-300' : 'text-gray-100'}`}
                    style={{ textShadow: isAISpeaking ? '0 0 20px rgba(167,139,250,0.2)' : 'none' }}
                >
                    {transcriptText || "Initializing interview..."}
                </p>
            </div>

            {/* ── Retry Toast (neon amber pulse) ── */}
            {retryMessage && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 50,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(25, 20, 10, 0.92)',
                        border: '1px solid rgba(251, 191, 36, 0.45)',
                        borderRadius: '14px',
                        padding: '12px 22px',
                        boxShadow: '0 0 24px rgba(251, 191, 36, 0.25)',
                        backdropFilter: 'blur(12px)',
                        animation: 'neonPulse 1.8s ease-in-out infinite',
                        maxWidth: '90vw',
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                    <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4 }}>
                        {retryMessage}
                    </span>
                </div>
            )}

            {/* ── Network Error — Reconnect Button ── */}
            {networkError && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(10, 10, 20, 0.94)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '16px',
                        padding: '20px 28px',
                        boxShadow: '0 0 32px rgba(239, 68, 68, 0.2)',
                        backdropFilter: 'blur(14px)',
                        maxWidth: '90vw',
                        textAlign: 'center',
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>📡</span>
                    <p style={{ color: '#f87171', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
                        Connection lost. Your answer was saved locally.
                    </p>
                    <button
                        onClick={handleReconnect}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444, #9333ea)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontWeight: 700,
                            padding: '10px 28px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            boxShadow: '0 0 18px rgba(147, 51, 234, 0.4)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.06)';
                            e.currentTarget.style.boxShadow = '0 0 28px rgba(147, 51, 234, 0.6)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 0 18px rgba(147, 51, 234, 0.4)';
                        }}
                    >
                        ↺ Reconnect & Retry
                    </button>
                </div>
            )}

            {/* Control Footer */}
            <footer className="flex items-center justify-between px-6 py-5 border-t border-white/10 bg-[#0F0F14]">
                {/* Timer Display */}
                <div className="flex flex-col">
                    <span className={`text-2xl font-mono font-bold tabular-nums ${timeRemaining <= 15 ? 'text-red-400' : 'text-gray-200'}`}>
                        {formatTime(timeRemaining)}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">remaining</span>
                </div>

                {/* Status Indicator */}
                <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                        networkError ? 'bg-red-500' :
                        isAISpeaking ? 'bg-purple-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-400">
                        {networkError ? 'Connection lost' :
                         isAISpeaking ? 'Alex is speaking' : 'Listening for your answer'}
                    </span>
                </div>

                {/* Manual Finish Button */}
                <button
                    onClick={handleEnd}
                    className="bg-linear-to-r from-purple-600 to-blue-500 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    End Interview
                </button>
            </footer>

            {/* Global animation keyframes */}
            <style>{`
                @keyframes neonPulse {
                    0%, 100% { box-shadow: 0 0 18px rgba(251, 191, 36, 0.25); }
                    50%       { box-shadow: 0 0 36px rgba(251, 191, 36, 0.55); }
                }
            `}</style>
        </div>
    );
}