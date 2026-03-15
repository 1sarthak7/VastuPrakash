// Vastu Rule Engine Definitions

export const SCORE_LEVELS = {
  forbidden: { score: 10, label: 'Forbidden', color: 'bg-danger' },
  avoid: { score: 30, label: 'Problematic', color: 'bg-warning' },
  neutral: { score: 55, label: 'Acceptable', color: 'bg-gray-400' },
  ok: { score: 65, label: 'Good', color: 'bg-[#8B7355]' },
  good: { score: 80, label: 'Excellent', color: 'bg-[#2A8C5A]' },
  best: { score: 100, label: 'Perfect', color: 'bg-vastu-green' }
};

export const DIRECTION_SCORES = {
  N: 75, NE: 95, E: 90, SE: 60, S: 45, SW: 40, W: 70, NW: 75
};

// Rules matrix mapping room type -> zone requirements
export const ROOM_RULES = {
  entrance: {
    best: ['N', 'NE', 'E'],
    ok: ['NW'],
    avoid: ['S', 'SW', 'SE', 'W'],
    forbidden: []
  },
  kitchen: {
    best: ['SE'],
    ok: ['NW'],
    avoid: ['N', 'NE', 'C'],
    forbidden: ['SW']
  },
  master_bed: {
    best: ['SW'],
    good: ['S', 'W'],
    ok: [],
    avoid: [],
    forbidden: ['NE']
  },
  bedroom: {
    best: ['SW', 'S', 'W'],
    ok: ['NW'],
    avoid: ['NE'],
    forbidden: []
  },
  living: {
    best: ['N', 'NE', 'E'],
    ok: ['NW'],
    avoid: ['SW'],
    forbidden: []
  },
  dining: {
    best: ['W', 'E'],
    ok: ['N', 'NE'],
    avoid: ['S', 'SW'],
    forbidden: []
  },
  bathroom: {
    best: ['NW', 'W', 'S'],
    ok: ['SE'],
    avoid: ['N', 'E'],
    forbidden: ['NE', 'SW', 'C']
  },
  puja: {
    best: ['NE'],
    good: ['N', 'E'],
    ok: [],
    avoid: ['S', 'SW', 'W'],
    forbidden: ['SE']
  },
  study: {
    best: ['N', 'NE'],
    ok: ['E', 'W'],
    avoid: ['SW', 'S'],
    forbidden: []
  },
  store: {
    best: ['NW', 'SW'],
    ok: ['W', 'S'],
    avoid: ['NE', 'N'],
    forbidden: []
  },
  open: {
    best: ['C', 'NE'],
    ok: ['N', 'E'],
    avoid: ['SW'],
    forbidden: []
  },
  garage: {
    best: ['NW', 'SE'],
    ok: ['W'],
    avoid: ['NE', 'SW'],
    forbidden: []
  },
  children: {
    best: ['NW', 'W'],
    ok: ['N', 'E'],
    avoid: ['SW'],
    forbidden: []
  }
};

export const TIPS_DB = {
  entrance: "The main door is the mouth of the house — it determines what energy enters. North and East doors face the sunrise and Kuber's direction, inviting Prana and prosperity. Ensure the door opens clockwise (inward-right), is well-lit, and has no obstruction like a wall directly facing it.",
  kitchen: "Fire (Agni) governs the kitchen. The South-East corner, ruled by the fire deity Agni, provides the perfect energy for cooking and nourishment. The cook should ideally face East while cooking. Avoid placing the cooking stove directly below a beam or facing the bathroom wall.",
  master_bed: "The South-West corner, governed by the earth element (Prithvi), provides grounding and stability — essential for the head of the household. The bed should be placed with the headboard toward South or West, never North. Avoid mirrors directly facing the bed.",
  bedroom: "Bedrooms are best placed in the South, West, or South-West to promote restful sleep. Ensure the head points South or West.",
  living: "The living area should ideally be in the North, East, or North-East to welcome guests with positive energy. Heavy furniture should be kept in the West or South.",
  dining: "The dining room is best in the West, associated with water and nourishment. Eating facing East or North aids digestion.",
  bathroom: "Bathrooms deal with waste and water. The North-West is ideal. Never place a bathroom in the sacred North-East, the grounding South-West, or the exact center (Brahmasthana).",
  puja: "The North-East (Isan corner) is the most sacred zone. A puja room here aligns with divine energies. Avoid placing it adjacent to a bathroom.",
  study: "North or East is excellent for a study room, as it enhances focus and intellect. Keep the study table facing East or North.",
  store: "Heavy storage should be placed in the South-West or North-West to anchor the house or clear clutter. Avoid the North-East.",
  open: "The center (Brahmasthana) and North-East must remain light and open to allow cosmic energy to flow freely.",
  garage: "The North-West is the zone of movement (Vayu), making it ideal for vehicles. South-East is also acceptable.",
  children: "Children's rooms are best in the North-West, encouraging growth and movement. West is also a good alternative."
};

// Main function to calculate a room's score
export const evaluateRoom = (roomType, zone) => {
  if (!roomType || !zone) return null;
  const rules = ROOM_RULES[roomType];
  if (!rules) return { level: 'neutral', score: SCORE_LEVELS.neutral.score, label: 'Unknown' };

  if (rules.forbidden?.includes(zone)) return { ...SCORE_LEVELS.forbidden, level: 'forbidden' };
  if (rules.avoid?.includes(zone)) return { ...SCORE_LEVELS.avoid, level: 'avoid' };
  if (rules.ok?.includes(zone)) return { ...SCORE_LEVELS.ok, level: 'ok' };
  if (rules.good?.includes(zone)) return { ...SCORE_LEVELS.good, level: 'good' };
  if (rules.best?.includes(zone)) return { ...SCORE_LEVELS.best, level: 'best' };
  
  return { ...SCORE_LEVELS.neutral, level: 'neutral' };
};

// Calculate overall house score
export const calculateOverallScore = (roomsList, facingDirection) => {
  if (roomsList.length === 0) return 0;
  
  let totalRoomScore = 0;
  let centerOccupied = false;
  
  // Special rule checks
  let neBathroomCount = 0;
  let hasSpecialWarnings = [];

  const analyzedRooms = roomsList.map(room => {
    const analysis = evaluateRoom(room.type, room.zone);
    if (!analysis) return null;

    totalRoomScore += analysis.score;
    
    // Checks for specific penalties
    if (room.zone === 'C' && room.type !== 'open') {
      centerOccupied = true;
    }
    if (room.type === 'bathroom' && room.zone === 'NE') {
      neBathroomCount++;
    }
    if (room.type === 'master_bed' && room.zone === 'NE') {
      hasSpecialWarnings.push("Master Bedroom in North-East Deity Zone!");
    }

    return { ...room, analysis };
  }).filter(Boolean);

  const roomAvg = analyzedRooms.length > 0 ? (totalRoomScore / analyzedRooms.length) : 0;
  const dirScore = DIRECTION_SCORES[facingDirection] || 0;
  
  let brahmaBonus = centerOccupied ? -15 : 5;
  let penalty = 0;
  if (neBathroomCount >= 2) penalty += 20;

  const rawScore = (roomAvg * 0.65) + (dirScore * 0.25) + (brahmaBonus * 0.10) - penalty;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return { finalScore, roomAvg, dirScore, brahmaBonus, penalty, analyzedRooms, hasSpecialWarnings };
};
