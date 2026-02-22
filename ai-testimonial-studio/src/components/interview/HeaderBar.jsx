export default function HeaderBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="text-sm font-semibold tracking-widest uppercase text-purple-500">
        AI Testimonial Studio
      </span>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
        <span className="text-xs font-medium text-red-400">LIVE</span>
      </div>
    </header>
  );
}