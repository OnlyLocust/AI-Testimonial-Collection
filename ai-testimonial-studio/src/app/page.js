'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (!prompt.trim()) return;
    console.log('Starting interview with prompt:', prompt);
    router.push('/interview');
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ backgroundColor: '#0F0F14' }}
    >
      {/* Ambient glow blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: '600px',
            height: '600px',
            top: '-120px',
            left: '50%',
            transform: 'translateX(-60%)',
            background: 'radial-gradient(circle, #7c3aed, #3b82f6)',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            width: '400px',
            height: '400px',
            bottom: '0px',
            right: '10%',
            background: 'radial-gradient(circle, #a855f7, #6366f1)',
          }}
        />
      </div>

      {/* Content */}
      <div
        className="relative flex flex-col items-center w-full max-w-2xl gap-8 text-center"
        style={{ zIndex: 1 }}
      >
        {/* Badge */}
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.35)',
            color: '#a78bfa',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#a78bfa' }}
          />
          AI-Powered · Zero Manual Effort
        </span>

        {/* Title */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          AI Testimonial Studio
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl max-w-lg leading-relaxed"
          style={{ color: '#9ca3af' }}
        >
          Let AI collect and edit your testimonials automatically.
        </p>

        {/* Input + CTA group */}
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

        {/* Footer hint */}
        <p className="text-xs mt-2" style={{ color: '#4b5563' }}>
          No signup required · Works in your browser · Powered by AI
        </p>
      </div>
    </main>
  );
}