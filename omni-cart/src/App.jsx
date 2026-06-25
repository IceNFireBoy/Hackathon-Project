import ExtensionDashboard from './ExtensionDashboard';
import DashboardShell from './layouts/DashboardShell';
import { BuildProvider } from './context/BuildContext';

export default function App() {
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

  if (isExtension) {
    return <ExtensionDashboard />;
  }

  return (
    <BuildProvider>
      <DashboardShell />
    </BuildProvider>
  );
}
