'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, RefreshCcw, Download, Edit3, 
  Check, Play, Video, Save, ChevronRight, Loader2,
  Quote, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TestimonialResultPage = () => {
  // --- State Management ---
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTone, setSelectedTone] = useState('formal');
  const [testimonial, setTestimonial] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  
  // Reel States
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [reelGenerated, setReelGenerated] = useState(false);

  // --- Mock Data ---
  const tones = {
    formal: "The level of professionalism and technical expertise displayed throughout our engagement was exemplary. Their AI-driven approach significantly optimized our workflow, resulting in a 40% increase in efficiency. I highly recommend their services for any enterprise seeking cutting-edge solutions.",
    casual: "Honestly, this tool is a game-changer! 🚀 I was blown away by how easy it was to get my thoughts across. The AI really 'got' what I was trying to say and turned it into a killer testimonial. If you're on the fence, just try it—you won't regret it!",
    linkedin: "I’m thrilled to share my experience working with this innovative platform. The integration of AI into the feedback loop is seamless and powerful. It’s rare to find a product that balances sophisticated tech with such a user-centric design. #Innovation #SaaS #AI"
  };

  const highlights = ["40% Efficiency Boost", "Seamless Integration", "User-Centric Design"];

  // --- Mock API Calls ---
  const generateTestimonial = (tone) => {
    setLoading(true);
    setTimeout(() => {
      setTestimonial(tones[tone]);
      setLoading(false);
    }, 1500);
  };

  const handleGenerateReel = () => {
    setIsGeneratingReel(true);
    setTimeout(() => {
      setIsGeneratingReel(false);
      setReelGenerated(true);
    }, 3000);
  };

  useEffect(() => {
    generateTestimonial('formal');
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testimonial);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 selection:bg-purple-500/30 py-12 px-4 sm:px-6">
      {/* Background Decorative Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* 1. Hero Section */}
        <header className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-purple-300">Analysis Complete</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Your Testimonial is <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-600">Ready</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            We've transformed your interview responses into a powerful, high-impact testimonial.
          </p>
        </header>

        {/* 2. Main Testimonial Card */}
        <motion.div 
          layout
          className="relative group mb-8"
        >
          {/* Neon Border Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-[#121217] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            
            {/* Tone Selector Tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
              {Object.keys(tones).map((tone) => (
                <button
                  key={tone}
                  onClick={() => { setSelectedTone(tone); generateTestimonial(tone); }}
                  className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                    selectedTone === tone ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  {selectedTone === tone && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-12"
                  >
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                    <p className="text-slate-400 text-sm animate-pulse">Refining with AI...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="text"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <Quote className="absolute -top-6 -left-6 w-12 h-12 text-white/5" />
                    {isEditing ? (
                      <textarea
                        value={testimonial}
                        onChange={(e) => setTestimonial(e.target.value)}
                        className="w-full h-40 bg-white/[0.03] border border-purple-500/30 rounded-2xl p-4 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-light leading-relaxed"
                      />
                    ) : (
                      <p className="text-xl md:text-2xl font-light leading-relaxed text-slate-100 italic text-center">
                        "{testimonial}"
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit Toggle */}
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-purple-400 transition-colors"
                >
                  {isEditing ? <><Save className="w-4 h-4" /> Save Edit</> : <><Edit3 className="w-4 h-4" /> Modify Text</>}
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex space-x-3">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-all active:scale-95"
                >
                  {isCopying ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopying ? 'Copied' : 'Copy'}</span>
                </button>
                <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-all active:scale-95">
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
              <button 
                onClick={() => generateTestimonial(selectedTone)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3. Highlights Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {highlights.map((h, i) => (
            <span key={i} className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-tight">
              {h}
            </span>
          ))}
        </div>

        {/* Visual Divider */}
        <div className="flex items-center space-x-4 mb-12 opacity-30">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
          <Zap className="w-4 h-4 text-slate-500" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
        </div>

        {/* 4. Reel Generation Section (The Upgrade) */}
        <section className="relative">
          <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start">
                  <Video className="w-6 h-6 mr-3 text-purple-400" />
                  Turn this into a Reel
                </h3>
                <p className="text-slate-400 text-sm">
                  Generate a cinematic video testimonial ready for Instagram or LinkedIn.
                </p>
              </div>

              {!reelGenerated ? (
                <button 
                  onClick={handleGenerateReel}
                  disabled={isGeneratingReel}
                  className="relative group px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-purple-400 hover:text-white disabled:opacity-50"
                >
                  {isGeneratingReel ? (
                    <span className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</span>
                  ) : (
                    "Generate Reel"
                  )}
                  <div className="absolute -inset-1 bg-purple-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-48 h-28 bg-slate-800 rounded-xl border border-purple-500/50 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-purple-600/20 group-hover:bg-purple-600/40 transition-all" />
                    <Play className="w-8 h-8 text-white relative z-10" />
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded">0:15</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs font-bold uppercase hover:bg-white/10 transition-colors">
                      <span>View Full Video</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          <p className="text-center mt-6 text-slate-600 text-[10px] uppercase tracking-[0.2em]">
            Takes a few seconds to synthesize audio and visuals
          </p>
        </section>

      </div>
    </div>
  );
};

export default TestimonialResultPage;