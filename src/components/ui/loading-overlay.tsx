import * as React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = 'Generating high-quality model...' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed left-0 right-0 bottom-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      style={{ 
        position: 'fixed',
        top: '60px', // Start below the navbar
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center space-y-4 max-w-sm mx-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-blue-500"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Model</h3>
          <p className="text-sm text-gray-600">{message}</p>
          <p className="text-xs text-gray-500 mt-2">This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
}
