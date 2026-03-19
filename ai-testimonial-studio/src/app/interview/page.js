'use client';

import { useRouter } from 'next/navigation';
import { useInterview } from '@/hooks/useInterview';
import { formatTime } from '@/lib/utils';

// Sub-components
import HeaderBar from '@/components/interview/HeaderBar';
import AIAvatar from '@/components/interview/AIAvatar';
import CameraPreview from '@/components/interview/CameraPreview';
import CameraError from '@/components/interview/CameraError';

const AI_QUESTIONS = [
    'Tell me about your experience. What made it truly special?',
    'How has this changed the way you work or live day-to-day?',
    'What would you say to someone who\'s on the fence about trying it?',
    'What\'s the one word you\'d use to describe the whole experience?',
];

export default function InterviewPage() {
    const router = useRouter();
    
    // Use our custom hook for all the heavy lifting
    const { 
        videoRef, isRecording, isAISpeaking, transcriptText, 
        captionVisible, timeRemaining, cameraError, streamRef 
    } = useInterview(AI_QUESTIONS, () => router.push('/preview'));

    if (cameraError) return <CameraError cameraError={cameraError} />;

    const handleEnd = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        router.push('/preview');
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0F0F14]">
            <HeaderBar />

            <main className="flex flex-1 gap-4 px-4 pt-4 lg:flex-row flex-col">
                <AIAvatar isAISpeaking={isAISpeaking} />
                <CameraPreview 
                    videoRef={videoRef} 
                    isRecording={isRecording} 
                    timeRemaining={timeRemaining} 
                    formatTime={formatTime} 
                />
            </main>

            {/* Transcription Area */}
            <div className="px-4 py-8 flex justify-center min-h-25">
                <p className={`text-xl sm:text-2xl font-semibold text-center transition-all duration-500 ${captionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} text-gray-100`}>
                    {transcriptText}
                </p>
            </div>

            {/* Footer Controls */}
            <footer className="flex items-center justify-between px-6 py-5 border-t border-white/10">
                <div className="flex flex-col">
                    <span className={`text-2xl font-mono font-bold ${timeRemaining <= 15 ? 'text-red-400' : 'text-gray-200'}`}>
                        {formatTime(timeRemaining)}
                    </span>
                    <span className="text-xs text-gray-500">remaining</span>
                </div>

                <button onClick={handleEnd} className="bg-linear-to-r from-purple-600 to-blue-500 px-6 py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform">
                    End Interview
                </button>
            </footer>
        </div>
    );
}