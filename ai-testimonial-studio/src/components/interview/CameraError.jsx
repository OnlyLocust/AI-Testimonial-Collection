const CameraError = ({cameraError}) => {
    return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
                style={{ backgroundColor: '#0F0F14' }}
            >
                <div
                    className="text-5xl"
                    aria-hidden="true"
                >
                    🎥
                </div>
                <h2 className="text-2xl font-bold text-white">Camera Access Required</h2>
                <p style={{ color: '#9ca3af' }} className="max-w-sm text-base leading-relaxed">
                    {cameraError}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
                >
                    Retry
                </button>
            </div>
        );
};

export default CameraError;