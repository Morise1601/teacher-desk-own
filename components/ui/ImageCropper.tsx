'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop, RotateCw, ZoomIn, Check } from 'lucide-react';

interface ImageCropperProps {
  image: string; // Base64 or URL
  aspectRatio: number; // e.g. 16 / 9
  onCrop: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, aspectRatio, onCrop, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a high-quality resolution for the crop
    // Calculate crop dimensions based on zoom
    // A zoom of 2x means we only take a 50% section of the image
    const cropNaturalWidth = (imgRef.current.naturalWidth / zoom);
    const cropNaturalHeight = (cropNaturalWidth / aspectRatio);
    
    canvas.width = 1280; // High-res target
    canvas.height = 1280 / aspectRatio;

    // Center crop with zoom
    const startX = (imgRef.current.naturalWidth - cropNaturalWidth) / 2;
    const startY = (imgRef.current.naturalHeight - cropNaturalHeight) / 2;

    ctx.drawImage(
      imgRef.current,
      startX, startY, cropNaturalWidth, cropNaturalHeight,
      0, 0, canvas.width, canvas.height
    );

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  }, [image, aspectRatio]);

  const handleConfirm = async () => {
    const blob = await getCroppedImg();
    if (blob) onCrop(blob);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-md overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-[var(--color-primary)]">
              <Crop size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Refine Banner Asset</h3>
              <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest">Enforcing {aspectRatio === 16/9 ? '16:9' : 'Standard'} Perspective</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Cropping Area */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div ref={containerRef} className="relative transition-all duration-300 ease-out" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}>
            <img
              ref={imgRef}
              src={image}
              alt="To Crop"
              className="max-h-[50vh] max-w-full select-none"
              draggable={false}
            />
            {/* Aspect Ratio Overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/50 flex flex-col justify-between p-4 mix-blend-difference">
               <div className="flex justify-between w-full">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white" />
               </div>
               <div className="flex justify-between w-full">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-white" />
               </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3 flex-1 md:flex-none">
              <ZoomIn size={14} className="text-gray-400" />
              <input 
                type="range" 
                min="0.5" max="3" step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
              />
            </div>
            <button 
              onClick={() => setRotation(r => r + 90)}
              className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-[10px] capitalize tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-all"
            >
              <RotateCw size={14} /> Rotate
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={onCancel}
              className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors capitalize tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-[var(--color-primary)] text-white text-sm font-bold rounded-md shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-98 transition-all capitalize tracking-widest"
            >
              <Check size={16} /> Apply & Finalize
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
