import React, { useState } from 'react';
import CapyMascot from './CapyMascot';
import BackgroundEffects from './BackgroundEffects';
import { UploadCloud, File as FileIcon, X, GraduationCap, Briefcase, BookOpen, Globe, PlayCircle } from 'lucide-react';

const PURPOSE_OPTIONS = [
  { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Simple explanations and study-friendly summaries' },
  { id: 'work', label: 'Work', icon: Briefcase, desc: 'Concise, professional and action-oriented' },
  { id: 'research', label: 'Research', icon: BookOpen, desc: 'Detailed, formal and highly accurate' },
  { id: 'general', label: 'General', icon: Globe, desc: 'A balanced tone for everyday reading' }
];

export default function Dashboard({ onStart }) {
  const [purpose, setPurpose] = useState('general');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const [isDragging, setIsDragging] = useState(false);

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
    setError('');
    
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
      
      onStart({ doc_id: data.doc_id, purpose, fileUrl: URL.createObjectURL(file) });
    } catch (err) {
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

      {/* Headline */}
      <div className="text-center z-10 mb-8 md:mb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold text-merlot mb-4 drop-shadow-[2px_2px_0_#F7E594]">Chat with your PDFs.</h1>
        <p className="text-xl md:text-2xl font-bold text-merlot opacity-80">Papr reads it so you don't have to.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-5xl z-10">
        <div className="flex-shrink-0 flex justify-center">
          <CapyMascot status={isUploading ? 'typing' : isDragging ? 'peeking' : 'idle'} size={380} showSpeech={true} />
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
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${isSelected ? 'bg-merlot text-white border-merlot' : 'bg-transparent text-merlot border-merlot/30 hover:border-merlot'}`}
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
          className={`p-4 rounded-xl font-bold text-xl border-merlot-3 transition-transform ${(!file || isUploading) ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-[#F5BAD5] hover:-translate-y-1 hover:shadow-[4px_4px_0_#570301] shadow-[2px_2px_0_#570301] active:scale-95'}`}
        >
          {isUploading ? 'Uploading...' : !file ? 'Add a PDF to start' : "Let's start"}
        </button>
      </div>
      </div>
    </div>
  );
}
