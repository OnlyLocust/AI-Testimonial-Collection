import { useRouter } from 'next/navigation';
import React, { useState } from "react";

const InterviewInput = () => {
    const [prompt, setPrompt] = useState('');
    const router = useRouter();

    const handleStart = () => {
        if (!prompt.trim()) return;
        console.log('Starting interview with prompt:', prompt);
        router.push('/interview');
    };

    return (
        <div className="w-full flex flex-col gap-4 mt-2">
            {/* Input field */}
            <div className="relative w-full group">
                {/* Glow ring on focus-within */}
                <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        zIndex: 0,
                    }}
                    aria-hidden="true"
                />
                <input
                    id="prompt-input"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    placeholder="Collect testimonial for my pizza restaurant…"
                    className="relative w-full rounded-xl px-5 py-4 text-base sm:text-lg outline-none transition-all duration-300 placeholder:opacity-50"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f9fafb',
                        zIndex: 1,
                        backdropFilter: 'blur(12px)',
                    }}
                    autoFocus
                />
            </div>

            {/* CTA Button */}
            <button
                id="start-interview-btn"
                onClick={handleStart}
                disabled={!prompt.trim()}
                className="
              w-full rounded-xl px-6 py-4
              text-base sm:text-lg font-semibold text-white
              transition-all duration-300 ease-out
              hover:scale-[1.03] active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            "
                style={{
                    background: prompt.trim()
                        ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)'
                        : 'linear-gradient(135deg, #4b2d8a 0%, #2a5091 100%)',
                    boxShadow: prompt.trim()
                        ? '0 0 32px rgba(124,58,237,0.45), 0 4px 16px rgba(59,130,246,0.3)'
                        : 'none',
                }}
            >
                Start Video Interview
            </button>
        </div>
    );
};

export default InterviewInput;