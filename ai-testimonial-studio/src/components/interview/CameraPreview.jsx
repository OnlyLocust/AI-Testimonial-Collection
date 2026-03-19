export default function CameraPreview({ videoRef, isRecording, timeRemaining, formatTime }) {
    return (
        <div className="lg:w-[70%] w-full relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 min-h-75">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/40">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-200 font-bold">REC</span>
                </div>
            )}
        </div>
    );
}