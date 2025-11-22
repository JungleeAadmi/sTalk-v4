import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { X, RotateCcw, Check } from 'lucide-react';

const CameraModal = ({ onClose, onCapture }) => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  
  const [imgSrc, setImgSrc] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  
  const [facingMode, setFacingMode] = useState("environment");
  const [mode, setMode] = useState('photo'); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [timer, setTimer] = useState(0);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  // --- SMART VIDEO RECORDING ---
  const startRecording = useCallback(() => {
    setChunks([]);
    setIsRecording(true);

    const stream = webcamRef.current.stream;
    
    // 1. Detect Best Supported Mime Type
    const mimeTypes = [
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
        "video/mp4;codecs=avc1", // iOS preferred
    ];
    let selectedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";

    try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: selectedType });
        
        mediaRecorderRef.current.addEventListener("dataavailable", ({ data }) => {
          if (data.size > 0) setChunks((prev) => [...prev, data]);
        });
        
        mediaRecorderRef.current.start();
    } catch (err) {
        console.error("Recorder Error:", err);
        alert("Camera recording not supported on this browser.");
        setIsRecording(false);
    }
  }, [webcamRef]);

  const stopRecording = useCallback(() => {
    if(!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    mediaRecorderRef.current.addEventListener("stop", () => {
       const blob = new Blob(chunks, { type: "video/mp4" }); // Container type
       setVideoBlob(URL.createObjectURL(blob));
    });
  }, [chunks]);

  const handleConfirm = async () => {
    if (mode === 'photo' && imgSrc) {
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    } else if (mode === 'video' && chunks.length > 0) {
      const blob = new Blob(chunks, { type: "video/mp4" });
      const file = new File([blob], `video-${Date.now()}.mp4`, { type: "video/mp4" });
      onCapture(file);
    }
  };

  const retake = () => {
    setImgSrc(null);
    setVideoBlob(null);
    setChunks([]);
  };

  const formatTime = (s) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex justify-between p-4 text-white bg-gradient-to-b from-black/80 to-transparent z-10 absolute top-0 w-full safe-area-top">
        <button onClick={onClose}><X size={28} /></button>
        
        <div className="flex gap-4 bg-black/40 rounded-full p-1 backdrop-blur-md">
            <button onClick={() => setMode('photo')} className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${mode==='photo' ? 'bg-white text-black' : 'text-white'}`}>Photo</button>
            <button onClick={() => setMode('video')} className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${mode==='video' ? 'bg-red-600 text-white' : 'text-white'}`}>Video</button>
        </div>

        <button onClick={() => setFacingMode(prev => prev==="user"?"environment":"user")}><RotateCcw size={28} /></button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        {imgSrc ? (
           <img src={imgSrc} className="w-full h-full object-contain" />
        ) : videoBlob ? (
           <video src={videoBlob} controls autoPlay loop className="w-full h-full object-contain" />
        ) : (
           <>
             <Webcam
               audio={true}
               muted={true} // IMPORTANT: Mute preview to prevent echo glitch
               ref={webcamRef}
               screenshotFormat="image/jpeg"
               forceScreenshotSourceSize={true} 
               videoConstraints={{ 
                  facingMode: facingMode,
                  width: { ideal: 1920 }, // 1080p is safer for mobile recording performance than 4K
                  height: { ideal: 1080 } 
               }}
               className="w-full h-full object-cover"
             />
             {isRecording && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-mono animate-pulse">
                    REC {formatTime(timer)}
                </div>
             )}
           </>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 bg-black flex justify-center items-center gap-10 safe-area-bottom min-h-[140px]">
        {(imgSrc || videoBlob) ? (
           <>
             <button onClick={retake} className="px-6 py-3 rounded-full bg-gray-800 text-white font-bold">Retake</button>
             <button onClick={handleConfirm} className="p-4 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/50"><Check size={32} /></button>
           </>
        ) : (
           <>
             {mode === 'photo' ? (
               <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white transition transform active:scale-95">
                 <div className="w-16 h-16 bg-white rounded-full"></div>
               </button>
             ) : (
               <button 
                 onClick={isRecording ? stopRecording : startRecording} 
                 className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition transform active:scale-95 ${isRecording ? 'border-red-600 bg-red-600/20' : 'border-white bg-white/20'}`}
               >
                 <div className={`transition-all duration-200 ${isRecording ? 'w-8 h-8 bg-red-600 rounded-sm' : 'w-16 h-16 bg-red-600 rounded-full'}`}></div>
               </button>
             )}
           </>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
