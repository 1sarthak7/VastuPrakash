import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVastuContext, ROOM_TYPES, DIRECTIONS } from '../store/VastuContext';
import { Move, Square, Eraser, DoorOpen, Undo, Redo, Trash2, Compass, Image as ImageIcon } from 'lucide-react';

const GRID_SIZE = 20;

const SnapToGrid = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

const DrawTab = () => {
  const { rooms, setRooms, facingDirection, setFacingDirection, setActiveTab, darkMode } = useVastuContext();
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Local UI State
  const [activeTool, setActiveTool] = useState('draw'); // 'draw', 'move', 'erase', 'entrance'
  const [activeRoomType, setActiveRoomType] = useState('living');
  const [showZoneOverlay, setShowZoneOverlay] = useState(true);
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  
  // Interaction State
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // History State
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Initialize History
  useEffect(() => {
    if (historyStep === 0 && rooms.length > 0 && history[0].length === 0) {
      setHistory([rooms]);
    }
  }, [rooms, historyStep, history]);

  const saveHistory = (newRooms) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newRooms);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    setRooms(newRooms);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setRooms(history[historyStep - 1]);
      setSelectedRoomId(null);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setRooms(history[historyStep + 1]);
      setSelectedRoomId(null);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
  }, [historyStep, history]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoordinates(e);
    const snappedX = SnapToGrid(coords.x);
    const snappedY = SnapToGrid(coords.y);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setStartPos({ x: snappedX, y: snappedY });
      setCurrentPos({ x: snappedX, y: snappedY });
    } else if (activeTool === 'move') {
      // Find room under cursor (reverse order to pick topmost)
      const clickedRoom = [...rooms].reverse().find(r => 
        coords.x >= r.x && coords.x <= r.x + r.w &&
        coords.y >= r.y && coords.y <= r.y + r.h
      );

      if (clickedRoom) {
        setSelectedRoomId(clickedRoom.id);
        setIsDragging(true);
        setDragOffset({ x: snappedX - clickedRoom.x, y: snappedY - clickedRoom.y });
      } else {
        setSelectedRoomId(null);
      }
    } else if (activeTool === 'erase') {
      const clickedRoom = [...rooms].reverse().find(r => 
        coords.x >= r.x && coords.x <= r.x + r.w &&
        coords.y >= r.y && coords.y <= r.y + r.h
      );
      if (clickedRoom) {
        const newRooms = rooms.filter(r => r.id !== clickedRoom.id);
        saveHistory(newRooms);
        if (selectedRoomId === clickedRoom.id) setSelectedRoomId(null);
      }
    } else if (activeTool === 'entrance') {
        // Just place a small entrance marker
        const newRooms = [...rooms, {
          id: Date.now().toString(),
          x: snappedX - GRID_SIZE,
          y: snappedY - GRID_SIZE,
          w: GRID_SIZE * 2,
          h: GRID_SIZE * 2,
          type: 'entrance',
          label: 'Entrance'
        }];
        saveHistory(newRooms);
    }
    
    // Fallback for clicking outside the room
    const targetRoom = [...rooms].find(r => 
        coords.x >= r.x && coords.x <= r.x + r.w &&
        coords.y >= r.y && coords.y <= r.y + r.h
      );
    if (!targetRoom && activeTool !== 'draw' && activeTool !== 'entrance') {
        setSelectedRoomId(null);
    }
  };

  const handlePointerMove = (e) => {
    const coords = getCanvasCoordinates(e);
    const snappedX = SnapToGrid(coords.x);
    const snappedY = SnapToGrid(coords.y);

    if (isDrawing) {
      setCurrentPos({ x: snappedX, y: snappedY });
    } else if (isDragging && selectedRoomId) {
      const updatedRooms = rooms.map(r => {
        if (r.id === selectedRoomId) {
          return { ...r, x: snappedX - dragOffset.x, y: snappedY - dragOffset.y };
        }
        return r;
      });
      setRooms(updatedRooms); // Don't save history on every move pixel
    }
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);
      if (w >= GRID_SIZE && h >= GRID_SIZE) {
        const typeInfo = ROOM_TYPES.find(t => t.id === activeRoomType);
        const newRoom = {
          id: Date.now().toString(),
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          w,
          h,
          type: activeRoomType,
          label: typeInfo.label
        };
        saveHistory([...rooms, newRoom]);
      }
    } else if (isDragging) {
      setIsDragging(false);
      saveHistory([...rooms]); // Save final position
    }
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all rooms?")) {
      saveHistory([]);
      setSelectedRoomId(null);
    }
  };

  // Render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw Grid (20px)
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(139,115,85,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += GRID_SIZE) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += GRID_SIZE) {
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Draw Zone Overlay (3x3 grid)
    if (showZoneOverlay) {
      const zw = w / 3;
      const zh = h / 3;
      
      const zones = [
        { id: 'NW', name: 'Vayu', x: 0, y: 0, color: 'rgba(128, 128, 128, 0.05)' },
        { id: 'N', name: 'Kuber', x: zw, y: 0, color: 'rgba(42, 140, 90, 0.05)' },
        { id: 'NE', name: 'Isan', x: zw * 2, y: 0, color: 'rgba(232, 149, 42, 0.05)' },
        { id: 'W', name: 'Varun', x: 0, y: zh, color: 'rgba(0, 0, 255, 0.03)' },
        { id: 'C', name: 'Brahma', x: zw, y: zh, color: 'rgba(250, 247, 242, 0.1)' },
        { id: 'E', name: 'Indra', x: zw * 2, y: zh, color: 'rgba(255, 165, 0, 0.05)' },
        { id: 'SW', name: 'Nairutya', x: 0, y: zh * 2, color: 'rgba(139, 69, 19, 0.05)' },
        { id: 'S', name: 'Yama', x: zw, y: zh * 2, color: 'rgba(160, 32, 32, 0.05)' },
        { id: 'SE', name: 'Agni', x: zw * 2, y: zh * 2, color: 'rgba(196, 86, 30, 0.05)' },
      ];

      zones.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.fillRect(z.x, z.y, zw, zh);
        
        ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(139,115,85,0.4)';
        ctx.font = '14px "Yatra One", serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${z.id} (${z.name})`, z.x + zw/2, z.y + zh/2);
      });

      // Zone Borders
      ctx.strokeStyle = darkMode ? 'rgba(232, 149, 42, 0.15)' : 'rgba(196, 86, 30, 0.15)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(zw, 0); ctx.lineTo(zw, h);
      ctx.moveTo(zw * 2, 0); ctx.lineTo(zw * 2, h);
      ctx.moveTo(0, zh); ctx.lineTo(w, zh);
      ctx.moveTo(0, zh * 2); ctx.lineTo(w, zh * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Rooms
    rooms.forEach(room => {
      const typeInfo = ROOM_TYPES.find(t => t.id === room.type) || { color: '#888' };
      const isSelected = selectedRoomId === room.id;
      
      ctx.fillStyle = typeInfo.color + (isSelected ? '66' : '33'); // Hex alpha
      ctx.fillRect(room.x, room.y, room.w, room.h);
      
      ctx.strokeStyle = typeInfo.color;
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      
      // Label
      ctx.fillStyle = darkMode ? '#FFF' : '#000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Basic text clipping workaround
      ctx.save();
      ctx.beginPath();
      ctx.rect(room.x, room.y, room.w, room.h);
      ctx.clip();
      ctx.fillText(room.label, room.x + room.w/2, room.y + room.h/2);
      ctx.restore();

      // Handles for selected room
      if (isSelected && activeTool === 'move') {
        const hSize = 8;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = typeInfo.color;
        
        const drawHandle = (hx, hy) => {
          ctx.fillRect(hx - hSize/2, hy - hSize/2, hSize, hSize);
          ctx.strokeRect(hx - hSize/2, hy - hSize/2, hSize, hSize);
        };
        
        drawHandle(room.x, room.y);
        drawHandle(room.x + room.w, room.y);
        drawHandle(room.x, room.y + room.h);
        drawHandle(room.x + room.w, room.y + room.h);
      }
    });

    // Draw current dragging preview
    if (isDrawing) {
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      
      const typeInfo = ROOM_TYPES.find(t => t.id === activeRoomType);
      
      ctx.fillStyle = typeInfo.color + '44';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = typeInfo.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

  }, [rooms, showZoneOverlay, isDrawing, currentPos, startPos, activeRoomType, selectedRoomId, activeTool, darkMode]);

  // Export to PNG wrapper
  const handleExport = () => {
    const link = document.createElement('a');
    link.download = 'vastu-floor-plan.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        
        {/* Tool Selector */}
        <div className="flex items-center gap-2 bg-cream dark:bg-[#1A1410] p-1 rounded-[8px] border border-vastu w-max">
          <button onClick={() => setActiveTool('draw')} title="Draw Room" className={`p-2 rounded-[6px] transition-colors ${activeTool === 'draw' ? 'bg-saffron text-white shadow-sm' : 'text-warm-gray hover:bg-black/5 dark:hover:bg-white/5'}`}>
            <Square size={20} />
          </button>
          <button onClick={() => setActiveTool('move')} title="Move/Select Room" className={`p-2 rounded-[6px] transition-colors ${activeTool === 'move' ? 'bg-saffron text-white shadow-sm' : 'text-warm-gray hover:bg-black/5 dark:hover:bg-white/5'}`}>
            <Move size={20} />
          </button>
          <button onClick={() => setActiveTool('entrance')} title="Place Entrance" className={`p-2 rounded-[6px] transition-colors ${activeTool === 'entrance' ? 'bg-saffron text-white shadow-sm' : 'text-warm-gray hover:bg-black/5 dark:hover:bg-white/5'}`}>
            <DoorOpen size={20} />
          </button>
          <button onClick={() => setActiveTool('erase')} title="Erase Room" className={`p-2 rounded-[6px] transition-colors ${activeTool === 'erase' ? 'bg-danger text-white shadow-sm' : 'text-warm-gray hover:bg-black/5 dark:hover:bg-white/5'}`}>
            <Eraser size={20} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyStep === 0} className="p-2 text-warm-gray disabled:opacity-30 hover:bg-cream dark:hover:bg-white/5 rounded-[6px]">
            <Undo size={18} />
          </button>
          <button onClick={redo} disabled={historyStep === history.length - 1} className="p-2 text-warm-gray disabled:opacity-30 hover:bg-cream dark:hover:bg-white/5 rounded-[6px]">
            <Redo size={18} />
          </button>
          <div className="w-px h-6 bg-vastu mx-1"></div>
          <button onClick={clearAll} className="p-2 text-warning hover:text-danger hover:bg-cream flex items-center gap-1 rounded-[6px] text-sm">
            <Trash2 size={16} /> Clear
          </button>
          <button onClick={handleExport} className="p-2 text-indigo dark:text-gold hover:bg-cream flex items-center gap-1 rounded-[6px] text-sm">
            <ImageIcon size={16} /> Export
          </button>
        </div>
      </div>

      {/* Room Type Selector (Horizontal Scroll) */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide py-1">
        {ROOM_TYPES.map(rt => (
          <button
            key={rt.id}
            onClick={() => {
              setActiveRoomType(rt.id);
              if (activeTool !== 'draw') setActiveTool('draw');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap text-sm border transition-all ${
              activeRoomType === rt.id && activeTool === 'draw'
                ? 'bg-white shadow-sm ring-2 ring-saffron border-transparent dark:bg-[#1A1410] dark:text-white' 
                : 'bg-transparent border-vastu text-warm-gray hover:bg-cream dark:hover:bg-white/5'
            }`}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: rt.color }}></span>
            {rt.label}
          </button>
        ))}
      </div>

      {/* Main Canvas Area */}
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
        {/* Canvas Wrapper */}
        <div 
          ref={containerRef}
          className="flex-1 bg-cream dark:bg-[#1A1410] border border-vastu rounded-[12px] overflow-hidden relative shadow-inner flex items-center justify-center cursor-crosshair touch-none"
        >
          <canvas
            ref={canvasRef}
            width={680}
            height={420}
            className="bg-white dark:bg-[#2A231E] shadow-sm m-4 max-w-full object-contain touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          {/* Direction Panel */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-indigo dark:text-gold">
              <Compass size={16} /> Facing Direction
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'].map(dir => (
                dir === 'C' ? (
                  <div key={dir} className="flex items-center justify-center text-warm-gray/50">center</div>
                ) : (
                  <button
                    key={dir}
                    onClick={() => setFacingDirection(dir)}
                    className={`py-2 rounded-[6px] font-medium border transition-colors ${
                      facingDirection === dir 
                        ? 'bg-saffron text-white border-saffron' 
                        : 'border-vastu text-warm-gray hover:bg-cream dark:hover:bg-white/5'
                    }`}
                  >
                    {dir}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Overlays Panel */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3 text-indigo dark:text-gold">View Settings</h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-warm-gray">
              <input 
                type="checkbox" 
                checked={showZoneOverlay}
                onChange={(e) => setShowZoneOverlay(e.target.checked)}
                className="w-4 h-4 text-saffron rounded border-vastu focus:ring-saffron"
              />
              Show 3x3 Vastu Grid
            </label>
          </div>

          <button 
            disabled={rooms.length < 2}
            onClick={() => setActiveTab('report')}
            className="mt-auto btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-vastu"
          >
            Analyze Layout <span className="text-xl">→</span>
          </button>
          {rooms.length < 2 && (
            <p className="text-xs text-center text-warning">Draw at least 2 rooms to analyze</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawTab;
