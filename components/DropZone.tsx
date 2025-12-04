import React, { useState, useRef, useCallback } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, disabled]);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer group
        flex flex-col items-center justify-center p-12 text-center h-80
        ${disabled ? 'opacity-50 cursor-not-allowed border-gray-600 bg-gray-800' : ''}
        ${isDragging 
          ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02] shadow-[0_0_30px_rgba(250,204,21,0.3)]' 
          : 'border-gray-600 hover:border-yellow-400 hover:bg-gray-800 bg-gray-800/50'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-200 mb-2 group-hover:text-white">
        {isDragging ? 'Drop it like it\'s hot!' : 'Drop an image here'}
      </h3>
      <p className="text-gray-400 text-sm max-w-xs group-hover:text-gray-300">
        or click to browse. We'll instantly turn it into a collectible figure.
      </p>
    </div>
  );
};