import React from 'react';
import { X, Download } from 'lucide-react';

const MediaViewer = ({ media, onClose }) => {
  if (!media) return null;

  const handleDownload = async () => {
    const response = await fetch(media.url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `stalk-media-${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md"><X /></button>
        <button onClick={handleDownload} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md"><Download /></button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {media.type === 'video' ? (
          <video src={media.url} controls autoPlay className="max-h-full max-w-full rounded shadow-2xl" />
        ) : (
          <img src={media.url} alt="Full view" className="max-h-full max-w-full object-contain rounded shadow-2xl" />
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
