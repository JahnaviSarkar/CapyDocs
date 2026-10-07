import React, { useState, useEffect } from 'react';
import CapyMascot from './CapyMascot';
import BackgroundEffects from './BackgroundEffects';
import { UploadCloud, File as FileIcon, X, GraduationCap, Briefcase, BookOpen, Globe, PlayCircle, FileText } from 'lucide-react';

const PURPOSE_OPTIONS = [
  { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Simple explanations and study-friendly summaries' },
  { id: 'work', label: 'Work', icon: Briefcase, desc: 'Concise, professional and action-oriented' },
  { id: 'research', label: 'Research', icon: BookOpen, desc: 'Detailed, formal and highly accurate' },
  { id: 'general', label: 'General', icon: Globe, desc: 'A balanced tone for everyday reading' }
];

export default function Dashboard({ onStart, timeoutError }) {
  const [purpose, setPurpose] = useState('general');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ status: 'checking', model: null });

  const [mascotSize, setMascotSize] = useState(window.innerWidth < 768 ? 128 : 192);

  useEffect(() => {
    const handleResize = () => setMascotSize(window.innerWidth < 768 ? 128 : 192);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWakingUp(true);
    }, 5000);

    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        clearTimeout(timer);
        setIsWakingUp(false);
        setHealthStatus({ status: 'up', model: data.model_name || data.model });
      })
      .catch(() => {
        clearTimeout(timer);
        setIsWakingUp(false);
        setHealthStatus({ status: 'down', model: null });
      });
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    if (selected && selected.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      setFile(null);
      return;
    }
    if (selected && selected.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB limit.');
      setFile(null);
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files[0]);
  };

  const handleStart = async () => {
    if (!file) return;
    setIsUploading(true);
    setIsWakingUp(false);
    setError('');
    
    const wakeTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 3000);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to upload PDF');
      }
      
      clearTimeout(wakeTimer);
      setIsWakingUp(false);
      onStart({ doc_id: data.doc_id, purpose, fileUrl: URL.createObjectURL(file) });
    } catch (err) {
      clearTimeout(wakeTimer);
      setIsWakingUp(false);
      setError(err.message === 'Failed to fetch' ? 'The backend server is offline.' : err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadSample = () => {
    // We will create public/sample.pdf later
    fetch('/sample.pdf')
      .then(res => res.blob())
      .then(blob => {
        const sampleFile = new File([blob], "Papr's Guide to Capybaras.pdf", { type: 'application/pdf' });
        setFile(sampleFile);
      });
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <BackgroundEffects />

      <div className="absolute top-4 right-4 md:right-8 z-50 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-merlot shadow-[2px_2px_0_#570301]">
          <div className={`w-2.5 h-2.5 rounded-full ${healthStatus.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs font-bold text-merlot">
            {healthStatus.status === 'up' 
              ? "Papr is awake" 
              : "Papr is napping, start the server"}
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="text-center z-10 mb-8 md:mb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold font-heading text-merlot mb-4 drop-shadow-[2px_2px_0_#F7E594]">Chat with your PDFs.</h1>
        <p className="text-xl md:text-2xl font-bold font-heading text-merlot opacity-80">Papr reads it so you don't have to.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-5xl z-10">
        <div className="flex-shrink-0 flex flex-col items-center gap-4 justify-center">
          <CapyMascot 
            status={isUploading ? 'typing' : isDragging ? 'peeking' : timeoutError ? 'sleepy' : 'idle'} 
            size={mascotSize} 
            showSpeech={true} 
            speechText={timeoutError ? "I dozed off, please upload again" : null} 
          />
          {isWakingUp && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-highlight border-2 border-merlot shadow-[2px_2px_0_#570301] animate-pulse text-center max-w-[200px]">
              <div className="w-4 h-4 rounded-full border-2 border-merlot border-t-transparent animate-spin flex-shrink-0"></div>
              <span className="text-xs font-bold text-merlot">Waking up cloud server (takes ~30s on free tier)...</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col gap-6 w-full max-w-md bg-white p-8 rounded-3xl border-merlot-3 shadow-[8px_8px_0_#570301]">
          {/* We remove the h1 CapyDocs title since we have a hero headline now */}
        
        <div className="flex flex-col gap-2">
          <label className="font-bold text-merlot">What are you using this for?</label>
          <div className="grid grid-cols-2 gap-2">
            {PURPOSE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = purpose === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPurpose(opt.id)}
                  className={`flex items-center font-heading gap-2 p-2 rounded-lg border-2 transition-colors ${isSelected ? 'bg-merlot text-white border-merlot' : 'bg-transparent text-merlot border-merlot/30 hover:border-merlot'}`}
                >
                  <Icon size={18} />
                  <span className="font-bold text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-merlot/80 italic mt-1 min-h-[20px]">
            {PURPOSE_OPTIONS.find(o => o.id === purpose)?.desc}
          </p>
        </div>

        {/* File Upload Zone */}
        {!file ? (
          <div className="flex flex-col gap-2 relative mt-2">
            <input 
              type="file" 
              accept=".pdf"
              id="file-upload" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <label 
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? 'border-merlot bg-[#BAD6FD]/30 scale-105' : 'border-merlot/50 hover:bg-gray-50 hover:border-merlot'}`}
            >
              <UploadCloud size={48} className={`mb-4 transition-colors ${isDragging ? 'text-merlot' : 'text-merlot/50'}`} />
              <span className="font-bold text-merlot text-center">Drag your PDF here or browse</span>
              <span className="text-sm text-merlot/60 mt-2">PDF only, up to 20 MB</span>
            </label>
            
            {error && <div className="text-sm font-bold text-red-600 bg-red-100 p-2 rounded-lg text-center">{error}</div>}
            
            <div className="text-center mt-2">
              <button 
                onClick={loadSample}
                className="text-sm font-bold text-merlot hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <PlayCircle size={14} /> No PDF? Try a sample
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between p-4 bg-[#BAD6FD]/20 border border-merlot rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="text-merlot flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-merlot truncate">{file.name}</span>
                  <span className="text-xs text-merlot/70">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)} 
                className="p-2 hover:bg-white rounded-full transition-colors text-merlot flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            {error && <div className="text-sm font-bold text-red-600 bg-red-100 p-2 rounded-lg text-center">{error}</div>}
          </div>
        )}

        <button 
          disabled={!file || isUploading} 
          onClick={handleStart}
          className={`p-4 rounded-xl font-heading font-bold text-xl border-merlot-3 transition-transform ${(!file || isUploading) ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-[#F5BAD5] hover:-translate-y-1 hover:shadow-[4px_4px_0_#570301] shadow-[2px_2px_0_#570301] active:scale-95'}`}
        >
          {isUploading ? 'Uploading...' : !file ? 'Add a PDF to start' : "Let's start"}
        </button>

        {/* Example Questions */}
        <div className="mt-2 flex flex-col gap-2">
          <span className="text-xs font-bold text-merlot/70 text-center uppercase tracking-wide">Try these after you upload:</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Summarize this", "Explain it simply", "What are the key dates?"].map(q => (
              <span key={q} className="px-3 py-1 bg-highlight/30 border border-merlot/30 rounded-full text-xs font-semibold text-merlot/80">{q}</span>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Extra details below the main fold */}
      <div className="w-full max-w-5xl mt-12 flex flex-col md:flex-row gap-6 justify-between items-center z-10">
        
        {/* How it works */}
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border-2 border-merlot/20 shadow-sm">
          <div className="flex flex-col items-center gap-1"><UploadCloud size={20} className="text-merlot"/><span className="text-xs font-bold text-merlot">Upload</span></div>
          <div className="w-4 h-[2px] bg-merlot/30" />
          <div className="flex flex-col items-center gap-1"><BookOpen size={20} className="text-merlot"/><span className="text-xs font-bold text-merlot">Papr reads</span></div>
          <div className="w-4 h-[2px] bg-merlot/30" />
          <div className="flex flex-col items-center gap-1"><FileText size={20} className="text-merlot"/><span className="text-xs font-bold text-merlot">Ask & cite</span></div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3">
          <span className="px-3 py-1.5 bg-[#BAD6FD] border border-merlot rounded-lg text-xs font-bold text-merlot">Cites page numbers</span>
          <span className="px-3 py-1.5 bg-[#F5BAD5] border border-merlot rounded-lg text-xs font-bold text-merlot">PDF kept in memory, not saved</span>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 z-10 text-center max-w-2xl px-4">
        <p className="text-merlot/80 text-xs font-bold border border-merlot/20 bg-[#F7E594]/30 py-2 px-4 rounded-xl shadow-sm">
          Your PDF's text is sent to an AI model to answer questions. Please don't upload private documents.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 z-10 text-center pb-4">
        <p className="text-merlot font-bold text-sm flex items-center justify-center gap-2">
          Made with love by Jahnavi 
          <a href="https://github.com/JahnaviSarkar/CapyDocs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-merlot rounded hover:bg-gray-50 transition-colors">
             GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
