'use client';

import AmbientBackground from '@/components/home/AmbientBackground';

export default function AIAvatar({ isAISpeaking }) {
    return (
        <div 
            className="lg:w-[30%] w-full flex flex-col items-center justify-center rounded-2xl p-6 relative overflow-hidden"
            style={{
                background: 'linear-gradient(145deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
                minHeight: '300px',
            }}
        >
            <AmbientBackground />
            
            {/* Glow effect */}
            <div
                className="absolute rounded-full blur-3xl transition-all duration-1000"
                style={{
                    width: '200px',
                    height: '200px',
                    background: isAISpeaking
                        ? 'radial-gradient(circle, rgba(124,58,237,0.5), transparent)'
                        : 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Avatar Circle */}
            <div
                className="relative rounded-full flex items-center justify-center transition-all duration-700"
                style={{
                    width: '120px',
                    height: '120px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                    boxShadow: isAISpeaking
                        ? '0 0 40px rgba(124,58,237,0.6)'
                        : '0 0 20px rgba(59,130,246,0.3)',
                }}
            >
                {isAISpeaking && (
                    <span className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ping" />
                )}
                
                {/* AI Icon */}
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
            </div>

            <div className="text-center z-10 mt-6">
                <p className="text-white font-semibold">Alex</p>
                <p className="text-xs text-purple-400 font-medium">AI Interviewer</p>
                
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    isAISpeaking ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-green-500/10 border-green-500/30 text-green-300'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAISpeaking ? 'bg-purple-400' : 'bg-green-400'}`} />
                    {isAISpeaking ? 'AI Speaking' : 'Listening...'}
                </div>
            </div>
        </div>
    );
}