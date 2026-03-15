import { useState } from 'react';
import { useVastuContext } from './store/VastuContext';
import { PenTool, Upload, Grid3X3, FileText, Settings, Moon, Sun, X } from 'lucide-react';

// Placeholder components for tabs
import DrawTab from './components/DrawTab';
import UploadTab from './components/UploadTab';
import ManualTab from './components/ManualTab';
import ReportTab from './components/ReportTab';

function App() {
  const { activeTab, setActiveTab, darkMode, setDarkMode } = useVastuContext();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_key') || '');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSaveConfig = () => {
    localStorage.setItem('gemini_key', apiKey);
    setShowSettings(false);
  };

  const tabs = [
    { id: 'draw', label: 'Draw Layout', icon: <PenTool size={18} /> },
    { id: 'upload', label: 'AI Detect', icon: <Upload size={18} /> },
    { id: 'manual', label: 'Manual Grid', icon: <Grid3X3 size={18} /> },
    { id: 'report', label: 'Vastu Report', icon: <FileText size={18} /> }
  ];

  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-hidden">
      {/* Background SVG Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] flex items-center justify-center">
        <svg width="600" height="600" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M 50 2 L 50 98 M 2 50 L 98 50" stroke="currentColor" strokeWidth="0.5" />
          <path d="M 16 16 L 84 84 M 16 84 L 84 16" stroke="currentColor" strokeWidth="0.5" />
          <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 50 50)" />
        </svg>
      </div>

      <header className="w-full bg-white dark:bg-[#1A1410] border-b border-vastu z-10 p-4 shrink-0 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl flex items-center gap-2">
          <span className="text-saffron">ॐ</span> VastuPrakash
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleDarkMode} className="p-2 text-warm-gray hover:text-saffron transition-colors rounded-full hover:bg-cream dark:hover:bg-[#2A231E]">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 text-warm-gray hover:text-saffron transition-colors rounded-full hover:bg-cream dark:hover:bg-[#2A231E]">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 z-10 flex flex-col">
        {/* Navigation Tabs */}
        <nav className="flex space-x-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-[8px] whitespace-nowrap font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-saffron text-white shadow-md' 
                  : 'bg-white dark:bg-[#2A231E] text-warm-gray hover:bg-saffron/10 hover:text-saffron border border-vastu/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content Area */}
        <div className="flex-1 bg-white dark:bg-[#1A1410] card p-4 md:p-6 lg:p-8 overflow-y-auto min-h-0">
          {activeTab === 'draw' && <DrawTab />}
          {activeTab === 'upload' && <UploadTab />}
          {activeTab === 'manual' && <ManualTab />}
          {activeTab === 'report' && <ReportTab />}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1410] rounded-[16px] border border-vastu shadow-2xl p-6 w-full max-w-md animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display text-indigo dark:text-gold flex items-center gap-2">
                <Settings size={20} /> Preferences
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-warm-gray hover:text-danger">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-warm-gray">Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..." 
                  className="w-full bg-cream dark:bg-[#2A231E] border border-vastu/30 rounded-[8px] p-3 text-sm focus:ring-2 focus:ring-saffron outline-none"
                />
                <p className="text-xs text-warm-gray mt-1 opacity-70">Saved locally in your browser. Used only for AI floor plan detection via Google Gemini.</p>
              </div>

              <div className="pt-4 border-t border-vastu/20">
                <button onClick={handleSaveConfig} className="btn-primary w-full">Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
