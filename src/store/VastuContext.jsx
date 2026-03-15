import { createContext, useContext, useState, useMemo } from 'react';

const VastuContext = createContext();

export const ROOM_TYPES = [
  { id: 'entrance', label: 'Entrance', color: '#1A2A6C' },
  { id: 'kitchen', label: 'Kitchen', color: '#C4561E' },
  { id: 'master_bed', label: 'Master Bedroom', color: '#8B7355' },
  { id: 'bedroom', label: 'Bedroom', color: '#D2B48C' },
  { id: 'living', label: 'Living Room', color: '#E8952A' },
  { id: 'dining', label: 'Dining Room', color: '#F4A460' },
  { id: 'bathroom', label: 'Bathroom', color: '#708090' },
  { id: 'puja', label: 'Puja Room', color: '#FFD700' },
  { id: 'study', label: 'Study/Office', color: '#4682B4' },
  { id: 'store', label: 'Storeroom', color: '#A0522D' },
  { id: 'open', label: 'Open Space', color: '#bd995cff' },
  { id: 'garage', label: 'Garage', color: '#808080' },
  { id: 'children', label: "Children's Room", color: '#8FBC8F' }
];

export const ZONES = ['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'];
export const DIRECTIONS = ['NW', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W'];

export const useVastuContext = () => useContext(VastuContext);

export const VastuProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw', 'upload', 'manual', 'report'
  const [rooms, setRooms] = useState([]); // Canvas rooms
  const [facingDirection, setFacingDirection] = useState('N');
  const [manualAssignments, setManualAssignments] = useState({}); // { zone: roomId }
  const [darkMode, setDarkMode] = useState(false);
  
  // AI State
  const [aiResult, setAiResult] = useState(null);
  
  // Rule Engine and Scoring (Placeholder for now)
  const calculateScore = useMemo(() => {
    // Will implement full rule engine logic here
    return 85; 
  }, [rooms, manualAssignments, facingDirection]);

  const value = {
    activeTab, setActiveTab,
    rooms, setRooms,
    facingDirection, setFacingDirection,
    manualAssignments, setManualAssignments,
    darkMode, setDarkMode,
    aiResult, setAiResult,
    calculateScore
  };

  return (
    <VastuContext.Provider value={value}>
      {children}
    </VastuContext.Provider>
  );
};
