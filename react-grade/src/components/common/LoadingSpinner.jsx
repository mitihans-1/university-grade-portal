import React from 'react';

const LoadingSpinner = ({ size = 40, color = '#1976d2', fullScreen = false }) => {
  const spinner = (
    <div style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `4px solid ${color}20`,
      borderTop: `4px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      {spinner}
    </div>
  );
};

export default LoadingSpinner;

