import React, { useState, useRef } from 'react';

const isLocal = true;
const API_BASE_URL = isLocal 
  ? 'http://localhost:8888/.netlify/functions' 
  : 'https://[YOUR-FUTURE-NETLIFY-URL]/.netlify/functions';

export default function FileUploadDashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Click or drag a schematic image/PDF here");
  const [extractedCart, setExtractedCart] = useState(null);
  
  // NEW: Reference to the hidden file input
  const fileInputRef = useRef(null);

  // --- Click & Drag Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setExtractedCart(null);
    processFile(file);
  };

  // NEW: Trigger the hidden input when the zone is clicked
  const handleZoneClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // NEW: Handle the file once the user selects it from the OS dialog
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setExtractedCart(null);
    processFile(file);
    
    // Reset the input so the user can upload the same file again if needed
    e.target.value = null; 
  };

  // --- File Processing Logic ---
  const processFile = async (file) => {
    const fileType = file.type;
    
    if (fileType === 'image/jpeg' || fileType === 'image/png') {
      setStatusText(`Processing Image: ${file.name}...`);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Full = event.target.result;
        const cleanBase64 = base64Full.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        
        const payload = {
          sourceType: "video_frames", 
          data: [cleanBase64]
        };
        
        await sendToAI(payload);
      };
      reader.readAsDataURL(file);

    } else if (fileType === 'application/pdf') {
      setStatusText(`Parsing PDF Data: ${file.name}...`);
      
      try {
        const extractedText = await parsePDFText(file);
        const payload = {
          sourceType: "article",
          data: extractedText
        };
        await sendToAI(payload);
      } catch (error) {
        setStatusText(`PDF Parsing Error: ${error.message}`);
      }
      
    } else {
      setStatusText("Unsupported file format. Please upload .png, .jpeg, or .pdf.");
    }
  };

  // --- PDF Architectural Scaffold ---
  const parsePDFText = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[SIMULATED PDF TEXT EXTRACTED FROM ${file.name}] The schematic requires an Arduino Nano, a 10k resistor, and a breadboard.`);
      }, 1000);
    });
  };

  // --- API Backend Communication ---
  const sendToAI = async (payload) => {
    setIsLoading(true);
    setStatusText("Analyzing hardware documentation with Omni-Cart AI...");

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      setExtractedCart(result);
      setStatusText("Click or drag another schematic to scan");

    } catch (error) {
      console.error("Omni-Cart Backend Error:", error);
      setStatusText(`Analysis Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Rendering ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8 flex flex-col items-center">
      
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
          OMNI-CART <span className="text-slate-100 font-light tracking-normal">WEB</span>
        </h1>
        <p className="text-sm text-slate-400 mt-2">Manual Schematic & Documentation Analyzer</p>
      </header>

      {/* NEW: Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
        accept=".png,.jpg,.jpeg,.pdf"
      />

      {/* Interactive Drop & Click Zone */}
      <div 
        onClick={handleZoneClick} // NEW: Added click trigger
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-2xl h-64 flex flex-col justify-center items-center border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer shadow-lg
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-900/20 shadow-emerald-900/50 scale-[1.02]' 
            : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50'
          }`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-12 w-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-medium text-emerald-400 animate-pulse">{statusText}</p>
          </div>
        ) : (
          <>
            <svg className={`w-16 h-16 mb-4 transition-colors ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className={`text-lg font-medium transition-colors ${isDragging ? 'text-emerald-300' : 'text-slate-300'}`}>
              {statusText}
            </p>
            <p className="text-xs text-slate-500 mt-2">Supports .PNG, .JPG, and .PDF</p>
          </>
        )}
      </div>

      {/* Human-Readable Payload Viewer */}
      {extractedCart && (
        <div className="w-full max-w-2xl mt-8 animate-fade-in-up pb-12">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">AI Extraction Results</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">Status: 200 OK</span>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-lg shadow-emerald-900/10">
            
            <div className="bg-slate-800/60 p-4 border-b border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Optimized Map Query</p>
              <p className="text-sm text-emerald-300 font-mono">"{extractedCart.optimized_maps_query}"</p>
            </div>

            <ul className="divide-y divide-slate-700/50">
              {extractedCart.components && extractedCart.components.map((item, index) => (
                <li key={index} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors group">
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-emerald-400 font-black text-sm bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-inner">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {item.confidence_score >= 0.8 ? (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                      High Match
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                      Verify ({(item.confidence_score * 100).toFixed(0)}%)
                    </span>
                  )}

                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}