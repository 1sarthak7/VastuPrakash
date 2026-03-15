import React, { useMemo, useEffect } from 'react';
import { useVastuContext, ROOM_TYPES } from '../store/VastuContext';
import { calculateOverallScore, TIPS_DB } from '../utils/vastuRules';
import { Printer, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';

const ReportTab = () => {
  const { rooms, manualAssignments, facingDirection, activeTab } = useVastuContext();

  // If there are canvas rooms, use them. If not, construct a room list from manual grid.
  const analyzedData = useMemo(() => {
    let roomsToAnalyze = [...rooms];
    
    // Fallback exactly to manual grid if canvas is empty
    if (roomsToAnalyze.length === 0) {
      roomsToAnalyze = Object.entries(manualAssignments).map(([zone, type]) => {
        const t = ROOM_TYPES.find(r => r.id === type);
        return {
          id: `${zone}-${type}`,
          type,
          label: t ? t.label : type,
          zone,
        };
      });
    }

    // Since our canvas doesn't assign zones yet automatically, let's map canvas coordinates to zones
    // For a real production app we would do geometric intersection, here we do a simple bounding box
    const getZoneFromPos = (x, y, w, h) => {
       // Canvas is 680x420, zones are 3x3
       const zw = 680 / 3;
       const zh = 420 / 3;
       const cx = x + w / 2;
       const cy = y + h / 2;
       
       if (cx < zw && cy < zh) return 'NW';
       if (cx >= zw && cx < zw*2 && cy < zh) return 'N';
       if (cx >= zw*2 && cy < zh) return 'NE';
       
       if (cx < zw && cy >= zh && cy < zh*2) return 'W';
       if (cx >= zw && cx < zw*2 && cy >= zh && cy < zh*2) return 'C';
       if (cx >= zw*2 && cy >= zh && cy < zh*2) return 'E';
       
       if (cx < zw && cy >= zh*2) return 'SW';
       if (cx >= zw && cx < zw*2 && cy >= zh*2) return 'S';
       return 'SE';
    };

    const finalRooms = roomsToAnalyze.map(r => ({
      ...r,
      zone: r.zone || getZoneFromPos(r.x, r.y, r.w, r.h)
    }));

    return calculateOverallScore(finalRooms, facingDirection);
  }, [rooms, manualAssignments, facingDirection, activeTab]);

  // Handle SVG animation for score circle
  const scorePercent = analyzedData.finalScore;
  const strokeDasharray = 251.2; // 2 * pi * r (r=40)
  const strokeDashoffset = strokeDasharray - (strokeDasharray * scorePercent) / 100;
  
  const scoreColor = scorePercent >= 75 ? 'text-vastu-green' 
                   : scorePercent >= 50 ? 'text-gold' 
                   : 'text-danger';

  const getStatusIcon = (level) => {
    if (['best', 'good'].includes(level)) return <CheckCircle className="text-vastu-green" size={20} />;
    if (['ok', 'neutral'].includes(level)) return <Info className="text-gold" size={20} />;
    return <AlertTriangle className="text-danger" size={20} />;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!analyzedData || analyzedData.analyzedRooms.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <h2 className="text-2xl font-display text-indigo dark:text-gold mb-4">Insufficient Data</h2>
        <p className="text-warm-gray mb-8">Please draw at least 2 rooms or assign 2 zones built to generate a report.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 print:pb-0">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center print:hidden border-b border-vastu/20 pb-4">
        <h2 className="text-2xl font-display text-indigo dark:text-gold">Vastu Analysis Report</h2>
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
          <Printer size={18} /> Download / Print PDF
        </button>
      </div>

      {/* OVERALL SCORE CARD */}
      <section className="card p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-cream dark:from-[#2A231E] dark:to-[#1A1410]">
        <div className="relative w-48 h-48 flex shrink-0 items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" className="stroke-current text-warm-gray/20" strokeWidth="8" fill="transparent" />
            <circle 
              cx="50" cy="50" r="40" 
              className={`stroke-current ${scoreColor} transition-all duration-1000 ease-out`}
              strokeWidth="8" fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-4xl font-display font-bold ${scoreColor}`}>
              {scorePercent}
            </span>
            <span className="text-xs uppercase tracking-widest text-warm-gray/70 font-semibold mt-1">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold font-display text-indigo dark:text-gold">
            {scorePercent >= 75 ? 'Excellent Alignment' : scorePercent >= 50 ? 'Moderate Alignment' : 'Needs Correction'}
          </h3>
          <p className="text-warm-gray leading-relaxed text-sm">
            This property faces <strong>{facingDirection}</strong> and scores {scorePercent}% on the Vastu Purusha Mandala scale. 
            {scorePercent >= 75 
              ? ' It represents a highly positive energy flow conducive to growth and harmony.'
              : scorePercent >= 50 
              ? ' While structurally sound, minor remedies are required to balance elemental energies.'
              : ' Structural defects are blocking cosmic flow; serious remedies or renovations are advised.'}
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-vastu/20">
            <div>
              <p className="text-xs uppercase text-warm-gray/70 mb-1">Room Placement</p>
              <p className="font-semibold">{Math.round(analyzedData.roomAvg)} / 100 avg</p>
            </div>
            <div>
              <p className="text-xs uppercase text-warm-gray/70 mb-1">Center (Brahmasthana)</p>
              <p className="font-semibold text-sm">{analyzedData.brahmaBonus > 0 ? 'Clear & Open (+5)' : 'Obstructed (-15)'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIAL WARNINGS */}
      {analyzedData.hasSpecialWarnings.length > 0 && (
        <section className="bg-danger/10 border-l-4 border-danger p-4 rounded-r-lg">
          <h4 className="font-bold text-danger flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Critical Vastu Violations
          </h4>
          <ul className="list-disc list-inside text-sm text-danger/80 space-y-1">
            {analyzedData.hasSpecialWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>
      )}

      {/* ROOM-BY-ROOM ANALYSIS */}
      <section>
        <h3 className="text-xl font-display mb-6 border-b border-vastu/30 pb-2 text-indigo dark:text-gold flex items-center gap-2">
           Room Analysis
        </h3>
        
        <div className="space-y-4">
          {/* Sort worst placements first */}
          {[...analyzedData.analyzedRooms].sort((a,b) => a.analysis.score - b.analysis.score).map((room, idx) => (
            <div key={idx} className="card p-4 flex flex-col md:flex-row gap-4 md:items-start group print:break-inside-avoid">
              <div className={`shrink-0 w-16 h-16 rounded-[12px] flex items-center justify-center text-white ${room.analysis.color}`}>
                <span className="font-display font-bold text-xl">{room.zone}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-lg dark:text-white">{room.label}</h4>
                  <div className="flex items-center gap-1.5 text-sm font-semibold bg-gray-50 dark:bg-white/5 px-2 py-1 rounded">
                    {getStatusIcon(room.analysis.level)}
                    <span className={room.analysis.score < 50 ? 'text-danger' : 'text-vastu-green'}>{room.analysis.label}</span>
                  </div>
                </div>
                
                <p className="text-sm text-warm-gray mt-2 leading-relaxed">
                  {TIPS_DB[room.type] || `Placed in ${room.zone} zone. Standard Vastu guidelines apply.`}
                </p>

                {room.analysis.score < 60 && (
                  <div className="mt-4 bg-warning/10 p-3 rounded-[8px] border border-warning/20">
                    <p className="text-xs font-semibold text-warning mb-1 uppercase tracking-wider">Suggested Remedy</p>
                    <p className="text-sm text-warm-gray dark:text-white/80">
                      {room.type === 'kitchen' && 'Place a small mirror on the East wall to reflect light. Ensure the cook faces East.'}
                      {room.type === 'bathroom' && 'Keep the door closed. Place a bowl of sea salt to absorb negative energy.'}
                      {room.type === 'entrance' && 'Place a Swastik or Om symbol above the door. Ensure adequate lighting.'}
                      {room.type === 'master_bed' && 'Using earth-toned colors and a raw crystal geode can help ground the energy.'}
                      {room.type !== 'kitchen' && room.type !== 'bathroom' && room.type !== 'entrance' && room.type !== 'master_bed' && 'Use specific Vastu Yantras for this direction or consult a Vastu expert for structural correction.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POSITIVE ENCOURAGEMENT */}
      {scorePercent >= 50 && (
        <section className="bg-vastu-green/10 border border-vastu-green/30 p-6 rounded-[12px] text-center print:break-inside-avoid">
          <Sparkles className="mx-auto text-vastu-green mb-3" size={32} />
          <h4 className="text-lg font-bold text-vastu-green mb-2">Harmonious Elements</h4>
          <p className="text-sm text-vastu-green/80 max-w-lg mx-auto">
            Your home has fundamentally sound placements. With mindful living and minor elemental corrections, it will serve as a sanctuary of positive Prana.
          </p>
        </section>
      )}

    </div>
  );
};

export default ReportTab;
