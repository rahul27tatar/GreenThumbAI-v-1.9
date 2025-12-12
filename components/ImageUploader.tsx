import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading, label }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      // Remove data URL prefix for API
      const base64 = result.split(',')[1];
      onImageSelected(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-emerald-100 group">
          <img src={preview} alt="Selected" className="w-full h-64 object-cover" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <Loader2 className="w-10 h-10 animate-spin mb-2" />
              <p className="font-medium animate-pulse">Analyzing nature's secrets...</p>
            </div>
          )}
          {!isLoading && (
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full text-red-500 transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-emerald-50/50 hover:bg-emerald-50 h-64 group"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8" />
          </div>
          <p className="text-emerald-900 font-semibold text-lg mb-1">{label}</p>
          <p className="text-emerald-600/70 text-sm text-center">
            Tap to snap or upload a photo
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
