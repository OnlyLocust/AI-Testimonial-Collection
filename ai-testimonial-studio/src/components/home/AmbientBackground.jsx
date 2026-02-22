import React from 'react'

const AmbientBackground = () => {
  return (
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

  )
}

export default AmbientBackground