import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    let interval;
    if (isRecording) interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Smart Mime Type Detection for iOS
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm";
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error", err);
      alert("Could not access microphone.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
        const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([audioBlob], `voice-${Date.now()}.${ext}`, { type: audioBlob.type });
        onSend(file);
    }
  };

  useEffect(() => {
      startRecording();
      return () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
          }
      }
  }, []);

  const formatTime = (s) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="flex items-center gap-3 flex-1 bg-red-50 dark:bg-red-900/20 p-2 rounded-full animate-fade-in">
        <div className={`w-3 h-3 bg-red-500 rounded-full ${isRecording ? 'animate-pulse' : ''}`}></div>
        <span className="text-red-500 font-mono text-sm">{formatTime(time)}</span>
        <div className="flex-1"></div>
        {!audioBlob ? (
            <button onClick={stopRecording} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                <Square size={16} fill="white" />
            </button>
        ) : (
            <>
                <button onClick={onCancel} className="p-2 text-gray-500 hover:text-red-500 transition"><Trash2 size={20} /></button>
                <button onClick={handleSend} className="p-2 bg-primary text-white rounded-full shadow-lg hover:brightness-110 transition"><Send size={18} /></button>
            </>
        )}
    </div>
  );
};

export default VoiceRecorder;
