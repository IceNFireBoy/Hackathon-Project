import { useEffect, useState, useRef } from 'react';
import { PageHeader } from '../components/dashboard';
import { Card, CardRow, Button, ConfidencePill, Badge, SkeletonCard } from '../components/ui';
import { useAnalyzeParts } from '../hooks/useAnalyzeParts';
import { useBuildContext } from '../context/BuildContext';

export default function IngestionView({ onNavigate }) {
  const { analyze, isAnalyzing, error } = useAnalyzeParts();
  const { importCart, importedCart } = useBuildContext();
  const [isDragging, setIsDragging] = useState(false);
  const [statusText, setStatusText] = useState('Click or drag a schematic image/PDF here');
  const [extractedCart, setExtractedCart] = useState(null);
  const [savedLocally, setSavedLocally] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!importedCart) return;
    setExtractedCart(importedCart);
    setSavedLocally(false);
    setStatusText('Imported extension scan. Click or drag another schematic to scan');
  }, [importedCart]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setExtractedCart(null);
      setSavedLocally(false);
      processFile(file);
    }
  };

  const handleZoneClick = () => {
    if (!isAnalyzing && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtractedCart(null);
    setSavedLocally(false);
    processFile(file);
    e.target.value = null;
  };

  const parsePDFText = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `[SIMULATED PDF TEXT EXTRACTED FROM ${file.name}] The schematic requires an Arduino Nano, a 10k resistor, and a breadboard.`
        );
      }, 1000);
    });
  };

  const sendToAI = async (payload) => {
    setStatusText('Analyzing hardware documentation with Omni-Cart AI...');
    try {
      const result = await analyze(payload);
      setExtractedCart(result);
      importCart(result, 'ingestion');
      setStatusText('Click or drag another schematic to scan');
    } catch (err) {
      setStatusText(`Analysis Failed: ${err.message}`);
    }
  };

  const processFile = async (file) => {
    const fileType = file.type;

    if (fileType === 'image/jpeg' || fileType === 'image/png') {
      setStatusText(`Processing Image: ${file.name}...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const cleanBase64 = event.target.result.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        await sendToAI({ sourceType: 'video_frames', data: [cleanBase64] });
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'application/pdf') {
      setStatusText(`Parsing PDF Data: ${file.name}...`);
      try {
        const extractedText = await parsePDFText(file);
        await sendToAI({ sourceType: 'article', data: extractedText });
      } catch (err) {
        setStatusText(`PDF Parsing Error: ${err.message}`);
      }
    } else {
      setStatusText('Unsupported file format. Please upload .png, .jpeg, or .pdf.');
    }
  };

  const handleSendToBuilder = () => {
    if (extractedCart?.components) {
      importCart(extractedCart, 'ingestion');
      onNavigate?.('builder');
    }
  };

  const handleSaveBuild = () => {
    setSavedLocally(true);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <PageHeader
        title="Ingestion Zone"
        subtitle="Upload schematics, images, or PDFs for AI-powered component extraction"
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept=".png,.jpg,.jpeg,.pdf"
      />

      <div
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full h-56 flex flex-col justify-center items-center border-2 border-dashed rounded-card transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-accent bg-accent-muted scale-[1.01]'
            : 'border-surface-card bg-surface-raised/50 hover:border-accent/40 hover:bg-surface-raised'
          }`}
      >
        {isAnalyzing ? (
          <div className="w-full max-w-md px-8 space-y-4">
            <SkeletonCard rows={2} tint="accent" />
            <p className="text-sm font-medium text-accent-bright animate-pulse text-center">{statusText}</p>
          </div>
        ) : (
          <>
            <svg
              className={`w-14 h-14 mb-3 transition-colors ${isDragging ? 'text-accent-bright' : 'text-slate-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className={`text-base font-medium ${isDragging ? 'text-accent' : 'text-slate-300'}`}>
              {statusText}
            </p>
            <p className="text-xs text-slate-500 mt-2">Supports .PNG, .JPG, and .PDF</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-critical text-center">{error}</p>
      )}

      {extractedCart && (
        <div className="mt-8 space-y-4 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success">{extractedCart.components?.length || 0} components</Badge>
            <span className="text-xs text-slate-500 font-mono truncate max-w-md">
              Map query: &quot;{extractedCart.optimized_maps_query}&quot;
            </span>
          </div>

          <Card variant="accent">
            <div className="px-4 py-2 bg-surface-raised/40 border-b border-surface-card/60 grid grid-cols-[auto_1fr_auto] gap-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <span>Qty</span>
              <span>Component</span>
              <span className="text-right">Confidence</span>
            </div>
            <div className="oc-row-divider">
              {extractedCart.components?.map((item, index) => (
                <CardRow key={index}>
                  <span className="text-accent-bright font-black text-sm bg-surface-base px-2 py-0.5 rounded border border-surface-card shrink-0 w-10 text-center">
                    {item.quantity}x
                  </span>
                  <span className="text-sm font-medium text-slate-200 flex-1 min-w-0 truncate ml-3">
                    {item.name}
                  </span>
                  <ConfidencePill score={item.confidence_score} />
                </CardRow>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSendToBuilder}>Send to Builder</Button>
            <Button variant="ghost" onClick={handleSaveBuild}>
              {savedLocally ? 'Saved to Archive (local)' : 'Save Build'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
