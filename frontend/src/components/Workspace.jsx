import React, { useState, useRef, useEffect } from 'react';
import CapyMascot from './CapyMascot';
import { Send, FileText } from 'lucide-react';

export default function Workspace({ session, onBack }) {
  const { doc_id, purpose, fileUrl } = session;
  const [messages, setMessages] = useState([{ role: 'system', text: "PDF loaded successfully! What would you like to know?" }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pageHash, setPageHash] = useState('');
  const [mascotStatus, setMascotStatus] = useState('idle');
  const [speechText, setSpeechText] = useState(null);
  const messagesEndRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const FUNNY_COMMENTS = [
    "Boom! Knowledge delivered.",
    "Did you get all that?",
    "Easy peasy.",
    "Another page devoured!",
    "My brain is huge right now."
  ];

  const IDLE_COMMENTS = [
    "Hey! Are you scrolling reels?",
    "Focus! The PDF won't read itself.",
    "Don't fall asleep on me!",
    "Are we still working?"
  ];

  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 30000 && !isTyping) {
        const randomIdle = IDLE_COMMENTS[Math.floor(Math.random() * IDLE_COMMENTS.length)];
        setSpeechText(randomIdle);
        setMascotStatus('peeking');
      }
    }, 5000);
    return () => clearInterval(checkIdle);
  }, [isTyping]);

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    if (speechText) {
      setSpeechText(null);
      setMascotStatus('idle');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const triggerAnswering = () => {
    setMascotStatus('peeking');
    const randomComment = FUNNY_COMMENTS[Math.floor(Math.random() * FUNNY_COMMENTS.length)];
    setSpeechText(randomComment);
    setTimeout(() => {
      setSpeechText(null);
      setMascotStatus('idle');
    }, 5000);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    updateActivity();
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    setMascotStatus('typing');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id, question: userMsg, purpose })
      });
      
      const data = await res.json();
      if (res.status === 410) {
        onBack(data.detail || "Session expired");
        return;
      }
      if (!res.ok) throw new Error(data.detail || 'Error generating answer');
      
      const ans = data.answer;
      if (ans.toLowerCase().includes("don't know") || ans.toLowerCase().includes("could not find")) {
        setMascotStatus('peeking');
      } else {
        triggerAnswering();
      }
      setMessages(prev => [...prev, { role: 'bot', text: ans, pages: data.pages_used }]);
    } catch (err) {
      if (err.message.toLowerCase().includes("timed out")) {
        setMascotStatus('sleepy');
        setMessages(prev => [...prev, { role: 'error', text: "Papr fell asleep waiting for the answer. The question might be too complex." }]);
      } else {
        setMascotStatus('peeking');
        setMessages(prev => [...prev, { role: 'error', text: err.message }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSummary = async () => {
    if (isTyping) return;
    updateActivity();
    setMessages(prev => [...prev, { role: 'user', text: "Generate a summary" }]);
    setIsTyping(true);
    setMascotStatus('typing');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id, purpose })
      });
      
      const data = await res.json();
      if (res.status === 410) {
        onBack(data.detail || "Session expired");
        return;
      }
      if (!res.ok) throw new Error(data.detail || 'Error generating summary');
      
      triggerAnswering();
      setMessages(prev => [...prev, { role: 'bot', text: data.summary }]);
    } catch (err) {
      if (err.message.toLowerCase().includes("timed out")) {
        setMascotStatus('sleepy');
        setMessages(prev => [...prev, { role: 'error', text: "Papr fell asleep waiting for the answer. The PDF might be too long." }]);
      } else {
        setMascotStatus('peeking');
        setMessages(prev => [...prev, { role: 'error', text: err.message }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handlePageClick = (page) => {
    updateActivity();
    setPageHash(`#page=${page}`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen p-4 gap-4 bg-background">
      {/* Left: PDF Viewer */}
      <div className="flex-1 rounded-3xl border-merlot-3 overflow-hidden bg-white shadow-[4px_4px_0_#570301]">
        <iframe 
          src={`${fileUrl}${pageHash}`} 
          className="w-full h-full" 
          title="PDF Viewer"
        />
      </div>

      {/* Right: Workspace */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top: Papr mascot */}
        <div className="bg-secondary rounded-3xl border-merlot-3 shadow-[4px_4px_0_#570301] p-4 min-h-[100px] flex justify-between items-center relative">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-white font-heading border-merlot-3 rounded-xl font-bold shadow-[2px_2px_0_#570301] hover:bg-gray-100"
          >
            ← Back
          </button>
          
          <div className="absolute inset-0 flex items-end pb-2 justify-center pointer-events-none">
            <div className="pointer-events-auto translate-y-2">
              <CapyMascot 
                status={isTyping ? 'typing' : mascotStatus} 
                showSpeech={!!speechText} 
                speechText={speechText} 
              />
            </div>
          </div>
          <button 
            onClick={handleSummary}
            disabled={isTyping}
            className="flex items-center gap-2 px-4 py-2 bg-highlight font-heading border-merlot-3 rounded-xl font-bold shadow-[2px_2px_0_#570301] hover:bg-yellow-300 disabled:opacity-50"
          >
            <FileText size={18} /> Summary
          </button>
        </div>

        {/* Bottom: Chat */}
        <div className="flex-1 bg-white rounded-3xl border-merlot-3 shadow-[4px_4px_0_#570301] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl border-merlot-3 shadow-sm ${msg.role === 'user' ? 'bg-primary' : msg.role === 'error' ? 'bg-red-200' : 'bg-gray-100'}`}>
                  <p className="whitespace-pre-wrap">{msg.text.replace(/SOURCES:.*$/, '').trim()}</p>
                  
                  {msg.pages && msg.pages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-merlot border-opacity-20">
                      <span className="text-xs font-bold pt-1">Jump to:</span>
                      {msg.pages.map(p => (
                        <button 
                          key={p} 
                          onClick={() => handlePageClick(p)}
                          className="px-2 py-1 bg-white text-xs font-bold border-merlot-3 rounded shadow-[1px_1px_0_#570301] hover:bg-secondary transition-colors"
                        >
                          Page {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-2xl border-merlot-3 shadow-sm flex gap-2">
                  <div className="w-2 h-2 bg-merlot rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-merlot rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-merlot rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t-merlot-3 bg-gray-50 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 p-3 rounded-xl border-merlot-3 outline-none focus:bg-white transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="p-3 bg-primary border-merlot-3 rounded-xl shadow-[2px_2px_0_#570301] hover:bg-pink-300 disabled:opacity-50 disabled:hover:bg-primary transition-colors flex justify-center items-center"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
