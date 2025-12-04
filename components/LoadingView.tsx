import React from 'react';

export const LoadingView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 rounded-2xl border border-gray-700 animate-pulse h-full min-h-[400px]">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🍌</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Sculpting your Figure...</h3>
      <p className="text-gray-400 text-center max-w-sm">
        Applying textures, setting up the desk, and rendering the box art. Please wait.
      </p>
    </div>
  );
};