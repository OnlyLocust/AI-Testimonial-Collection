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
    
    // We no longer pass AI_QUESTIONS here because the hook 
    // now manages questions via localStorage and API responses.
    const { 
        videoRef, 
        isRecording, 
        isAISpeaking, 
        transcriptText, 
        captionVisible, 
        timeRemaining, 
        cameraError, 
        streamRef 
    } = useInterview(() => router.push('/preview'));

    if (cameraError) return <CameraError cameraError={cameraError} />;

    const handleEnd = () => {
        // Stop all camera and mic tracks before leaving
        streamRef.current?.getTracks().forEach(t => t.stop());
        router.push('/preview');
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
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isAISpeaking ? 'bg-purple-500' : 'bg-green-500'}`} />
                    <span className="text-sm font-medium text-gray-400">
                        {isAISpeaking ? "Alex is speaking" : "Listening for your answer"}
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
        </div>
    );
}