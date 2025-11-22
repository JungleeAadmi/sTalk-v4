import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/canvasUtils';
import { Camera, X, Check, ZoomIn } from 'lucide-react';

const ProfileUploader = ({ currentImage, onUpload }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      // Upload the blob
      const formData = new FormData();
      formData.append('file', blob, 'profile.jpg');
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.url) {
        onUpload(data.url);
        setImageSrc(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <div className="relative w-32 h-32 mx-auto group cursor-pointer">
        <img 
          src={currentImage || "https://via.placeholder.com/150"} 
          alt="Profile" 
          className="w-full h-full rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
        />
        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
          <Camera className="text-white" size={32} />
          <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </label>
      </div>

      {/* Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black/80 z-10">
            <button onClick={() => setImageSrc(null)} className="text-white p-2"><X /></button>
            <h3 className="text-white font-bold">Adjust Photo</h3>
            <button onClick={showCroppedImage} className="text-blue-400 p-2"><Check /></button>
          </div>

          <div className="relative flex-1 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div className="p-6 bg-gray-900 safe-area-bottom">
             <div className="flex items-center gap-4">
                <ZoomIn className="text-gray-400" size={20} />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileUploader;
