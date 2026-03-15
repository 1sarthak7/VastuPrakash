import React, { useState } from 'react';
import { useVastuContext, ROOM_TYPES, ZONES } from '../store/VastuContext';
import { evaluateRoom } from '../utils/vastuRules';
import { Compass, X } from 'lucide-react';

const ZONE_DETAILS = {
  NW: { name: 'Vayu', deity: 'Vayu', color: '#8A9A5B' },
  N: { name: 'Kuber', deity: 'Kubera', color: '#2A8C5A' },
  NE: { name: 'Isan', deity: 'Ishana', color: '#E8952A' },
  W: { name: 'Varun', deity: 'Varuna', color: '#4682B4' },
  C: { name: 'Brahmasthana', deity: 'Brahma', color: '#FAF7F2' },
  E: { name: 'Indra', deity: 'Indra', color: '#F4A460' },
  SW: { name: 'Nairutya', deity: 'Nirriti', color: '#A0522D' },
  S: { name: 'Yama', deity: 'Yama', color: '#A02020' },
  SE: { name: 'Agni', deity: 'Agni', color: '#C4561E' }
};

const ManualTab = () => {
  const { manualAssignments, setManualAssignments, facingDirection, setFacingDirection, setActiveTab, darkMode, setRooms } = useVastuContext();
  const [activeZone, setActiveZone] = useState(null); // Which zone's popover is open

  const handleAssign = (roomId) => {
    if (!activeZone) return;
    setManualAssignments(prev => ({
      ...prev,
      [activeZone]: roomId
    }));
    setActiveZone(null);
  };

  const handleClearZone = (zone) => {
    setManualAssignments(prev => {
      const next = { ...prev };
      delete next[zone];
      return next;
    });
    setActiveZone(null);
  };

  const getStatusIcon = (level) => {
    if (level === 'best' || level === 'good') return '✓✓';
    if (level === 'ok') return '✓';
    if (level === 'neutral') return '~';
    if (level === 'avoid') return '⚠';
    if (level === 'forbidden') return '✗';
    return '';
  };

  const assignedCount = Object.keys(manualAssignments).length;

  const prepareForReport = () => {
    // Clear canvas rooms to ensure ReportTab falls back to manual assignments
    setRooms([]);
    setActiveTab('report');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* 3x3 Grid Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-[600px] aspect-square relative">
          
          {ZONES.map(zone => {
            const detail = ZONE_DETAILS[zone];
            const assignedRoomId = manualAssignments[zone];
            const roomInfo = ROOM_TYPES.find(r => r.id === assignedRoomId);
            const evaluation = roomInfo ? evaluateRoom(roomInfo.id, zone) : null;
            const isCenter = zone === 'C';

            return (
              <div 
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`
                  relative border-2 rounded-[12px] p-2 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02]
                  ${activeZone === zone ? 'ring-4 ring-saffron border-saffron shadow-lg z-10' : 'border-vastu/30 shadow-sm'}
                `}
                style={{ 
                  backgroundColor: roomInfo 
                    ? roomInfo.color + (darkMode ? '44' : '22') 
                    : detail.color + (darkMode ? '15' : '10')
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start opacity-70 text-xs font-semibold">
                  <span className="bg-white/50 dark:bg-black/30 px-1.5 py-0.5 rounded">{zone}</span>
                  {evaluation && (
                    <span className={`px-1.5 py-0.5 rounded text-white ${evaluation.color}`}>
                      {getStatusIcon(evaluation.level)}
                    </span>
                  )}
                </div>

                {/* Center Content */}
                <div className="text-center my-auto">
                  {roomInfo ? (
                    <div className="font-bold text-lg dark:text-white drop-shadow-sm">{roomInfo.label}</div>
                  ) : (
                    <div className="text-warm-gray opacity-50 text-sm">Empty</div>
                  )}
                </div>

                {/* Footer details */}
                <div className="text-center text-[10px] uppercase tracking-wider text-warm-gray opacity-80 font-display">
                  {detail.name} • {detail.deity}
                </div>
              </div>
            );
          })}

          {/* Room Selector Popover */}
          {activeZone && (
            <div className="absolute inset-0 bg-white/90 dark:bg-[#1A1410]/95 backdrop-blur-sm z-20 rounded-[16px] border border-vastu shadow-2xl p-6 flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-display text-indigo dark:text-gold flex items-center gap-2">
                  Assign Room to {activeZone} <span className="opacity-50 text-sm">({ZONE_DETAILS[activeZone].name})</span>
                </h3>
                <button onClick={() => setActiveZone(null)} className="p-2 hover:bg-cream dark:hover:bg-white/5 rounded-full text-warm-gray">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-2 pb-4">
                <button 
                  onClick={() => handleClearZone(activeZone)}
                  className="p-3 border-2 border-dashed border-vastu/50 text-warm-gray rounded-[8px] hover:bg-danger/10 hover:text-danger hover:border-danger transition-colors flex flex-col items-center justify-center gap-2 h-20"
                >
                  <X size={20} /> Clear Zone
                </button>

                {ROOM_TYPES.map(rt => {
                  const evalResult = evaluateRoom(rt.id, activeZone);
                  return (
                    <button
                      key={rt.id}
                      onClick={() => handleAssign(rt.id)}
                      className="p-3 border border-vastu/30 rounded-[8px] flex flex-col items-center justify-center gap-1 h-20 bg-white dark:bg-[#2A231E] hover:border-saffron hover:shadow-md transition-all relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: rt.color }}></div>
                      <span className="font-medium text-sm text-center line-clamp-2 leading-tight mt-1">{rt.label}</span>
                      
                      {/* Show quick tooltip metric on hover */}
                      <div className={`absolute bottom-0 w-full text-[10px] py-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity ${evalResult.color}`}>
                        {evalResult.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-display text-indigo dark:text-gold mb-2">Vastu Mandala</h2>
          <p className="text-sm text-warm-gray mb-6">
            Assign rooms directly to the 9 cardinal zones to get a structural Vastu analysis without drawing a floor plan.
          </p>

          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-indigo dark:text-gold border-t border-vastu/30 pt-4">
            <Compass size={16} /> Facing Direction
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-6">
            {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(dir => (
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
            ))}
          </div>

          <div className="bg-cream dark:bg-white/5 p-4 rounded-[8px] mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Assigned Zones</span>
              <span className="text-sm font-bold text-saffron">{assignedCount} / 9</span>
            </div>
            <div className="w-full bg-vastu/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-saffron h-full transition-all duration-500" 
                style={{ width: `${(assignedCount / 9) * 100}%` }}
              ></div>
            </div>
          </div>

          <button 
            disabled={assignedCount < 2}
            onClick={prepareForReport}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-vastu"
          >
            Generate Report <span className="text-xl">→</span>
          </button>
          {assignedCount < 2 && (
            <p className="mt-2 text-xs text-center text-warning">Assign at least 2 zones</p>
          )}

        </div>
      </div>
    </div>
  );
};

export default ManualTab;
