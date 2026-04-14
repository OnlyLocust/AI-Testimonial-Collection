'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Copy, RefreshCcw, Download, Edit3,
  Check, Play, Video, Save, ChevronRight, Loader2,
  Quote, Zap, Share2, Wand2, Trophy, TrendingUp, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Reel loading stages (shown sequentially while the backend runs)
// ─────────────────────────────────────────────────────────────
const REEL_STAGES = [
  { label: "Analyzing audio...",     duration: 1400 },
  { label: "Matching visuals...",    duration: 1400 },
  { label: "Rendering Reel...",      duration: 1200 },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TONE_LABELS = { formal: "Formal", casual: "Casual", linkedin: "LinkedIn" };

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const TestimonialResultPage = () => {
  // ── Core states ──
  const [loading, setLoading]               = useState(true);
  const [isEditing, setIsEditing]           = useState(false);
  const [selectedTone, setSelectedTone]     = useState('formal');
  const [testimonial, setTestimonial]       = useState("");
  const [isCopying, setIsCopying]           = useState(false);
  const [sessionId, setSessionId]           = useState(null);

  // ── Polish-My-Changes states ──
  const [isPolishing, setIsPolishing]       = useState(false);
  const [polishSuccess, setPolishSuccess]   = useState(false);
  const [originalInEdit, setOriginalInEdit] = useState(""); // tracks starting state on edit entry

  // ── Reel states ──
  const [reelStage, setReelStage]           = useState(-1);   // -1 = idle
  const [reelLoading, setReelLoading]       = useState(false);
  const [reelUrl, setReelUrl]               = useState(null);
  const [reelError, setReelError]           = useState(null);
  const [shareSuccess, setShareSuccess]     = useState(false);

  // ── Bundle data ──
  const [bundleData, setBundleData] = useState({
    formal:   "Loading formal testimonial...",
    casual:   "Loading casual testimonial...",
    linkedin: "Loading linkedin testimonial...",
    highlights:   ["Loading..."],
    achievements: [],
  });

  // ─────────────────────────────
  // Load from sessionStorage
  // ─────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('testimonial_bundle');
    if (stored) {
      try { setBundleData(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
    const sid = sessionStorage.getItem('current_session_id');
    if (sid) setSessionId(sid);
  }, []);

  // ─────────────────────────────
  // Switch tone → update textarea
  // ─────────────────────────────
  const generateTestimonial = useCallback((tone, bundle) => {
    setLoading(true);
    setTimeout(() => {
      setTestimonial((bundle || bundleData)[tone] || "Error loading testimonial.");
      setLoading(false);
    }, 700);
  }, [bundleData]);

  useEffect(() => {
    generateTestimonial(selectedTone, bundleData);
  }, [selectedTone, bundleData]);

  // ─────────────────────────────
  // Copy to clipboard
  // ─────────────────────────────
  const copyToClipboard = () => {
    navigator.clipboard.writeText(testimonial);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  // ─────────────────────────────
  // Edit mode toggle
  // ─────────────────────────────
  const handleEditToggle = () => {
    if (!isEditing) {
      setOriginalInEdit(testimonial); // snapshot when entering edit
      setPolishSuccess(false);
    }
    setIsEditing(prev => !prev);
  };

  // ─────────────────────────────
  // Polish My Changes
  // ─────────────────────────────
  const handlePolish = async () => {
    if (!testimonial.trim() || isPolishing) return;
    setIsPolishing(true);
    setPolishSuccess(false);
    try {
      const res = await fetch(`${API}/video/re-polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edited_text: testimonial }),
      });
      const data = await res.json();
      if (data.polished_text) {
        setTestimonial(data.polished_text);
        setPolishSuccess(true);
        setTimeout(() => setPolishSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Re-polish error:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  // ─────────────────────────────
  // Reel generation helper
  // ─────────────────────────────
  const runLoadingStages = () => new Promise(resolve => {
    let i = 0;
    const next = () => {
      if (i >= REEL_STAGES.length) { resolve(); return; }
      setReelStage(i);
      setTimeout(() => { i++; next(); }, REEL_STAGES[i].duration);
    };
    next();
  });

  const handleGenerateReel = async () => {
    if (reelLoading) return;
    setReelLoading(true);
    setReelError(null);

    // Run stage labels + the actual API call in parallel
    const [, apiResult] = await Promise.allSettled([
      runLoadingStages(),
      fetch(`${API}/video/generate-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId || "dev-session" }),
      }).then(r => r.json()),
    ]);

    setReelStage(-1);
    setReelLoading(false);

    if (apiResult.status === 'fulfilled' && apiResult.value?.video_url) {
      setReelUrl(apiResult.value.video_url);
    } else {
      setReelError("Render failed — please try again.");
    }
  };

  // ─────────────────────────────
  // Share
  // ─────────────────────────────
  const handleShare = () => {
    if (reelUrl && navigator.share) {
      navigator.share({ title: "My AI Video Testimonial", url: reelUrl }).catch(() => {});
    } else if (reelUrl) {
      navigator.clipboard.writeText(reelUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Derived: has the user changed the text from what it was
  // on entering edit mode?
  // ─────────────────────────────────────────────────────────
  const hasUserEdited = isEditing && testimonial !== originalInEdit;

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 selection:bg-purple-500/30 py-12 px-4 sm:px-6">

      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-900/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-900/20 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-violet-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto">

        {/* ── Hero ── */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-purple-300">Analysis Complete</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Your Testimonial is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-500">
              Ready
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            We&apos;ve transformed your interview responses into a powerful, high-impact testimonial.
          </p>
        </header>

        {/* ── Main Card ── */}
        <motion.div layout className="relative group mb-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
          <div className="relative bg-[#121217] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">

            {/* Tone tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
              {Object.entries(TONE_LABELS).map(([tone, label]) => (
                <button
                  key={tone}
                  id={`tab-${tone}`}
                  onClick={() => { if (!isEditing) setSelectedTone(tone); }}
                  className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                    selectedTone === tone ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                  } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {label}
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
                        id="testimonial-editor"
                        value={testimonial}
                        onChange={e => setTestimonial(e.target.value)}
                        className="w-full min-h-[10rem] bg-white/[0.03] border border-purple-500/30 rounded-2xl p-4 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-light leading-relaxed resize-y"
                      />
                    ) : (
                      <p className="text-xl md:text-2xl font-light leading-relaxed text-slate-100 italic text-center">
                        &ldquo;{testimonial}&rdquo;
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit controls row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  id="btn-edit-toggle"
                  onClick={handleEditToggle}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-purple-400 transition-colors"
                >
                  {isEditing
                    ? <><Save className="w-4 h-4" /><span>Save Edit</span></>
                    : <><Edit3 className="w-4 h-4" /><span>Modify Text</span></>
                  }
                </button>

                {/* Polish My Changes — visible only in edit mode */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.button
                      id="btn-polish-changes"
                      key="polish-btn"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={handlePolish}
                      disabled={isPolishing || !hasUserEdited}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                        polishSuccess
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : hasUserEdited
                            ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
                            : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {isPolishing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Polishing...</span></>
                      ) : polishSuccess ? (
                        <><Check className="w-3.5 h-3.5" /><span>Polished!</span></>
                      ) : (
                        <><Wand2 className="w-3.5 h-3.5" /><span>Polish My Changes</span></>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions bar */}
            <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex space-x-3">
                <button
                  id="btn-copy"
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-all active:scale-95"
                >
                  {isCopying ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopying ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  id="btn-download"
                  onClick={() => {
                    const blob = new Blob([testimonial], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url;
                    a.download = `testimonial-${selectedTone}.txt`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" /><span>Download</span>
                </button>
              </div>
              <button
                id="btn-regenerate"
                onClick={() => generateTestimonial(selectedTone, bundleData)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
              >
                <RefreshCcw className="w-4 h-4" /><span>Regenerate</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Highlights & Achievements ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          {/* Key Highlights */}
          {(bundleData.highlights ?? []).length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Key Highlights</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {bundleData.highlights.map((h, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-tight">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements / Metrics */}
          {(bundleData.achievements ?? []).length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-amber-300">Measurable Wins</h2>
              </div>
              <ul className="space-y-2">
                {bundleData.achievements.map((a, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center space-x-4 mb-12 opacity-30">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
          <Zap className="w-4 h-4 text-slate-500" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
        </div>

        {/* ── Reel Section ── */}
        <section className="relative" aria-label="Video Reel Generation">
          <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">

              {/* Copy */}
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start">
                  <Video className="w-6 h-6 mr-3 text-purple-400" />
                  Turn this into a Reel
                </h3>
                <p className="text-slate-400 text-sm">
                  Generate a cinematic video testimonial ready for Instagram or LinkedIn.
                </p>
              </div>

              {/* Right panel — idle / loading / ready */}
              <div className="flex flex-col items-center gap-4 min-w-[12rem]">

                {/* ─── IDLE ─── */}
                {!reelLoading && !reelUrl && (
                  <motion.button
                    id="btn-generate-reel"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={handleGenerateReel}
                    className="relative group px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-purple-400 hover:text-white"
                  >
                    Generate Reel
                    <div className="absolute -inset-1 bg-purple-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
                  </motion.button>
                )}

                {/* ─── LOADING ─── */}
                {reelLoading && (
                  <motion.div
                    key="reel-loading"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3 px-6 py-5 bg-white/5 border border-white/10 rounded-2xl min-w-[10rem]"
                  >
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={reelStage}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-sm text-purple-300 font-semibold"
                      >
                        {reelStage >= 0 ? REEL_STAGES[reelStage].label : "Starting..."}
                      </motion.p>
                    </AnimatePresence>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <motion.div
                        className="h-full bg-purple-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: reelStage >= 0 ? `${((reelStage + 1) / REEL_STAGES.length) * 100}%` : "5%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ─── ERROR ─── */}
                {reelError && !reelLoading && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center space-x-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>{reelError}</span>
                    <button onClick={handleGenerateReel} className="text-white font-bold ml-2 hover:text-purple-300 transition-colors">Retry</button>
                  </motion.div>
                )}

                {/* ─── READY ─── */}
                {reelUrl && !reelLoading && (
                  <motion.div
                    key="reel-ready"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    {/* HTML5 video player */}
                    <div className="w-64 aspect-video rounded-xl overflow-hidden border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                      <video
                        id="reel-video-player"
                        src={reelUrl}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full object-cover bg-black"
                        poster=""
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-2">
                      <a
                        id="btn-download-reel"
                        href={reelUrl}
                        download="testimonial-reel.mp4"
                        className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wide hover:bg-white/10 transition-colors"
                      >
                        <Download className="w-4 h-4" /><span>Download Reel</span>
                      </a>
                      <button
                        id="btn-share-reel"
                        onClick={handleShare}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide transition-colors ${
                          shareSuccess
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {shareSuccess
                          ? <><Check className="w-4 h-4" /><span>Link Copied!</span></>
                          : <><Share2 className="w-4 h-4" /><span>Share</span></>
                        }
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
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