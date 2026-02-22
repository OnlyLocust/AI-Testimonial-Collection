'use client';
import AmbientBackground from '@/components/home/AmbientBackground';
import InterviewInput from '@/components/home/InterviewInput';

export default function Home() {
  

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ backgroundColor: '#0F0F14' }}
    >
      {/* Ambient glow blobs */}
      <AmbientBackground/>

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
        <InterviewInput/>

        {/* Footer hint */}
        <p className="text-xs mt-2" style={{ color: '#4b5563' }}>
          No signup required · Works in your browser · Powered by AI
        </p>
      </div>
    </main>
  );
}