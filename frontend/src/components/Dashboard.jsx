import React, { useState } from 'react';
import Papr from './Papr';

export default function Dashboard({ onStart }) {
  const [purpose, setPurpose] = useState('general');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen items-center justify-center p-8 gap-12">
      <div className="flex-1 flex justify-center md:justify-end">
        <Papr message="Let's chat with your PDF!" />
      </div>
      
      <div className="flex-1 flex flex-col gap-6 max-w-md bg-white p-8 rounded-3xl border-merlot-3 shadow-[8px_8px_0_#570301]">
        <h1 className="text-4xl font-bold">CapyDocs</h1>
        
        <div className="flex flex-col gap-2">
          <label className="font-bold">What are you using this for?</label>
          <select 
            value={purpose} 
            onChange={(e) => setPurpose(e.target.value)}
            className="p-3 rounded-xl border-merlot-3 bg-secondary font-semibold cursor-pointer outline-none"
          >
            <option value="general">General</option>
            <option value="student">Student</option>
            <option value="work">Work</option>
            <option value="research">Research</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold">Upload a PDF</label>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
            className="p-3 border-dashed border-[3px] border-merlot rounded-xl cursor-pointer bg-highlight bg-opacity-20 hover:bg-opacity-40 transition-colors"
          />
          {file && <div className="text-sm font-semibold text-green-700">Selected: {file.name}</div>}
          {error && <div className="text-sm font-bold text-red-600 bg-red-100 p-2 rounded-lg">{error}</div>}
        </div>

        <button 
          disabled={!file || isUploading} 
          onClick={handleStart}
          className={`p-4 rounded-xl font-bold text-xl border-merlot-3 transition-transform ${(!file || isUploading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:-translate-y-1 hover:shadow-[4px_4px_0_#570301] shadow-[2px_2px_0_#570301]'}`}
        >
          {isUploading ? 'Uploading...' : "Let's start"}
        </button>
      </div>
    </div>
  );
}
