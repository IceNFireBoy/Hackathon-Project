import ExtensionDashboard from './ExtensionDashboard';
import FileUploadDashboard from './FileUploadDashboard';
import OnlineStoreDashboard from './OnlineStoreDashboard';
import DashboardShell from './layouts/DashboardShell';
import { BuildProvider } from './context/BuildContext';

export default function App() {
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

  // If we are testing locally in a web browser (npm run dev), show the Dev Toggle Menu
  if (!isExtension) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Dev Mode Navigation Bar */}
        <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-center space-x-4 shadow-md z-50 relative">
          <button 
            onClick={() => setCurrentView('website')}
            className={`px-4 py-2 rounded text-xs font-bold transition-colors ${currentView === 'website' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            💻 Web Dashboard View
          </button>
          <button 
            onClick={() => setCurrentView('extension')}
            className={`px-4 py-2 rounded text-xs font-bold transition-colors ${currentView === 'extension' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            🧩 Extension Popup View
          </button>
          <button 
            onClick={() => setCurrentView('online')}
            className={`px-4 py-2 rounded text-xs font-bold transition-colors ${currentView === 'online' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            🛒 Online Store View
          </button>
        </div>

        {/* Render the selected interface */}
        <div className="flex-1 flex justify-center items-start pt-8 overflow-y-auto">
          {currentView === 'website' ? (
            <FileUploadDashboard />
          ) : currentView === 'online' ? (
            <OnlineStoreDashboard />
          ) : (
            // We wrap the extension in a mock popup window so you can see how it looks while coding!
            <div className="shadow-2xl shadow-blue-900/20 rounded-lg overflow-hidden border border-slate-700">
               <ExtensionDashboard />
            </div>
          )}
        </div>
      </div>
    );
  }
  if (isExtension) {
    return <ExtensionDashboard />;
  }

  return (
    <BuildProvider>
      <DashboardShell />
    </BuildProvider>
  );
}
