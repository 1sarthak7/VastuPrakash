import React, { useState, useRef } from 'react';
import { useVastuContext, ROOM_TYPES } from '../store/VastuContext';
import { UploadCloud, Image as ImageIcon, Loader2, Sparkles, X, CheckCircle, AlertTriangle } from 'lucide-react';

const UploadTab = () => {
  const { setRooms, setActiveTab, facingDirection, setFacingDirection } = useVastuContext();
  
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [parsedResults, setParsedResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image exceeds 5MB limit. Please try a smaller file.");
      return;
    }
    
    setError(null);
    setParsedResults(null);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Create a spoofed event object
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setParsedResults(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeImage = async () => {
    const apiKey = localStorage.getItem('gemini_key');
    if (!apiKey) {
      setError("AI detection requires a Gemini API key. Add yours to the settings panel.");
      return;
    }

    setLoading(true);
    setError(null);
    
    // Simulate loading steps visually
    const msgs = ["Reading floor plan...", "Identifying rooms...", "Mapping Vastu zones...", "Calculating alignments..."];
    let step = 0;
    setLoadingMessage(msgs[step]);
    const interval = setInterval(() => {
      step = (step + 1) % msgs.length;
      setLoadingMessage(msgs[step]);
    }, 1500);

    try {
      // Clean base64 string
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imagePreview.split(';')[0].split(':')[1];

      const systemPrompt = `You are a Vastu Shastra expert and architect analyzing floor plan images.
Identify all rooms/spaces visible in the image. For each room, determine:
1. Its type (from the allowed list)
2. Its approximate position in the floor plan (map to a 3x3 Vastu grid)
3. The facing direction if visible or inferrable

The 3x3 Vastu Purusha Mandala zones (top = North by default):
NW(Vayu) | N(Kuber)   | NE(Isan)
W(Varun) | C(Brahma)  | E(Indra)  
SW(Nairutya)| S(Yama) | SE(Agni)

Return ONLY minified JSON without any markdown fences or extra text:
{
  "rooms": [
    {"type": "kitchen", "zone": "SE", "label": "Kitchen", "confidence": 0.92},
    {"type": "entrance", "zone": "N", "label": "Main Entrance", "confidence": 0.88}
  ],
  "direction": "N",
  "notes": "Brief observation about the floor plan layout"
}

Valid room types exactly matching these IDs: entrance, kitchen, master_bed, bedroom, living, dining, bathroom, puja, study, store, open, garage, children
Valid zones: NW, N, NE, W, C, E, SW, S, SE`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {text: systemPrompt},
              {text: "Analyze this floor plan and return the JSON according to the instructions."},
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API Request Failed");
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text.trim();
      
      // Attempt to parse JSON even if surrounded by backticks
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.rooms || !Array.isArray(parsed.rooms)) {
        throw new Error("Invalid response format from AI.");
      }

      setParsedResults(parsed);
      if (parsed.direction) {
        setFacingDirection(parsed.direction);
      }

    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const removeParsedRoom = (idx) => {
    const updated = { ...parsedResults };
    updated.rooms = updated.rooms.filter((_, i) => i !== idx);
    setParsedResults(updated);
  };

  const useResults = () => {
    // Generate valid room objects for canvas/report
    const mappedRooms = parsedResults.rooms.map((r, i) => {
      const typeInfo = ROOM_TYPES.find(t => t.id === r.type);
      return {
        id: `ai-${Date.now()}-${i}`,
        type: typeInfo ? r.type : 'open',
        label: r.label || (typeInfo ? typeInfo.label : 'Unknown'),
        zone: r.zone,
        // Mock canvas positions since AI doesn't give them exact pixels (only zones)
        x: 0, 
        y: 0,
        w: 50,
        h: 50
      };
    });
    
    setRooms(mappedRooms);
    setActiveTab('report');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      
      {/* Upload & Preview Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {!imagePreview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full max-w-lg border-2 border-dashed border-vastu/40 hover:border-saffron rounded-[16px] p-12 flex flex-col items-center justify-center cursor-pointer transition-colors bg-cream/50 dark:bg-[#2A231E]/50 group"
          >
            <div className="w-16 h-16 bg-white dark:bg-[#1A1410] rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} className="text-saffron" />
            </div>
            <h3 className="text-xl font-display text-indigo dark:text-gold mb-2">Upload Floor Plan</h3>
            <p className="text-warm-gray text-center text-sm max-w-[250px]">
              Drag & drop your floor plan image here, or click to browse. (JPG, PNG, WebP up to 5MB)
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center">
            <div className="relative border border-vastu rounded-[12px] p-2 bg-white dark:bg-[#2A231E] shadow-sm w-full">
              <button 
                onClick={clearImage}
                className="absolute -top-3 -right-3 bg-white dark:bg-[#1A1410] border border-vastu rounded-full p-1 text-danger hover:scale-110 shadow-sm transition-transform"
                title="Remove image"
              >
                <X size={16} />
              </button>
              <img 
                src={imagePreview} 
                alt="Floor Plan Preview" 
                className="w-full max-h-[350px] object-contain rounded-[8px]"
              />
            </div>
            
            {error ? (
              <div className="mt-6 w-full bg-danger/10 border border-danger/30 text-danger p-4 rounded-[8px] flex items-start gap-3 text-sm">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : !parsedResults && !loading && (
              <div className="mt-8 flex flex-col items-center w-full gap-4">
                <div className="w-full max-w-xs">
                  <label className="block text-sm font-semibold mb-2 text-warm-gray text-center">Known Facing Direction?</label>
                  <select 
                    value={facingDirection}
                    onChange={(e) => setFacingDirection(e.target.value)}
                    className="w-full bg-cream dark:bg-[#2A231E] border border-vastu/30 rounded-[8px] p-3 text-sm focus:ring-2 focus:ring-saffron outline-none text-center"
                  >
                    <option value="N">North (Default)</option>
                    <option value="NE">North-East</option>
                    <option value="E">East</option>
                    <option value="SE">South-East</option>
                    <option value="S">South</option>
                    <option value="SW">South-West</option>
                    <option value="W">West</option>
                    <option value="NW">North-West</option>
                  </select>
                </div>
                
                <button onClick={analyzeImage} className="btn-primary flex items-center gap-2 text-lg px-8 py-3 shadow-vastu mt-2 w-full max-w-xs justify-center">
                   <Sparkles size={20} /> Analyze AI ↗
                </button>
              </div>
            )}

            {loading && (
              <div className="mt-12 flex flex-col items-center text-saffron">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-semibold">{loadingMessage}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Results Sidebar */}
      {parsedResults && (
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 animate-in slide-in-from-right-8 duration-300">
          <div className="card p-5 h-full flex flex-col">
            <h3 className="text-xl font-display text-indigo dark:text-gold mb-1 flex items-center gap-2">
               <CheckCircle size={20} className="text-vastu-green" /> Analysis Complete
            </h3>
            
            <div className="mt-4 flex-1 overflow-y-auto pr-2 pb-4 space-y-3">
              {parsedResults.rooms.length === 0 ? (
                <p className="text-sm text-warm-gray italic">No rooms distinctly identified.</p>
              ) : (
                parsedResults.rooms.map((room, idx) => {
                  const typeInfo = ROOM_TYPES.find(r => r.id === room.type) || { color: '#888' };
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 border border-vastu/30 rounded-[8px] bg-cream/50 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: typeInfo.color }}></span>
                        <div>
                          <p className="font-semibold text-sm leading-tight">{room.label}</p>
                          <p className="text-xs text-warm-gray mt-0.5">Zone: {room.zone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {room.confidence && (
                          <span className="text-[10px] bg-vastu/20 px-1.5 py-0.5 rounded text-warm-gray font-mono">
                            {Math.round(room.confidence * 100)}%
                          </span>
                        )}
                        <button onClick={() => removeParsedRoom(idx)} className="text-warm-gray hover:text-danger p-1">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {parsedResults.notes && (
              <div className="mt-4 p-3 bg-saffron/5 border border-saffron/20 rounded-[8px] mb-6">
                <h4 className="text-xs font-bold text-saffron mb-1 uppercase">AI Notes</h4>
                <p className="text-xs text-warm-gray leading-relaxed">{parsedResults.notes}</p>
              </div>
            )}

            <button onClick={useResults} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
              Generate Report →
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default UploadTab;
