import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/upload/FileUpload';
import { RequirementsUpload } from './components/upload/RequirementsUpload';
import { UploadResults } from './components/upload/UploadResults';
import { RecentContributions } from './components/dashboard/RecentContributions';
import { ProgressSummary } from './components/dashboard/ProgressSummary';
import { Dashboard } from './components/dashboard/Dashboard';
import { UploadModeToggle, type UploadMode } from './components/common/UploadModeToggle';
import { DatabaseService } from './services/supabase';
import PriceUpdateService from './services/priceUpdateService';
import type { UploadResult } from './types/uploads';
import './App.css';

function App() {
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('contribution');
  const [currentView, setCurrentView] = useState<'upload' | 'dashboard'>('upload');

  // Test database connection and initialize price updates on load
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔄 React: Starting connection test from useEffect...');
      try {
        const connected = await DatabaseService.testConnection();
        console.log('🔄 React: testConnection returned:', connected);
        console.log('🔄 React: About to call setIsConnected with:', connected);
        setIsConnected(connected);
        console.log('🔄 React: setIsConnected called');

        // Initialize price updates if connected
        if (connected) {
          console.log('📊 Initializing price update system...');
          PriceUpdateService.initializeAppPrices();
        }
      } catch (error) {
        console.error('🔄 React: Connection test failed with exception:', error);
        setIsConnected(false);
      }
    };

    testConnection();

    // Set up periodic price updates
    const cleanup = PriceUpdateService.schedulePeriodicUpdates();
    
    // Return cleanup function
    return cleanup;
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 React: isConnected state changed to:', isConnected);
  }, [isConnected]);

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResults(prev => [result, ...prev]);
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  // Connection status indicator
  const ConnectionStatus = () => {
    console.log('🔄 React: Rendering ConnectionStatus with isConnected =', isConnected);
    
    if (isConnected === null) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
            <span className="text-yellow-800 text-sm">Testing database connection...</span>
          </div>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
            <span className="text-red-800 font-medium">Database Connection Failed</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Check your Supabase configuration in .env.local
          </p>
          <button 
            onClick={async () => {
              console.log('🔄 React: Manual connection test triggered');
              setIsConnected(null); // Show loading
              try {
                const connected = await DatabaseService.testConnection();
                console.log('🔄 React: Manual test result:', connected);
                setIsConnected(connected);
              } catch (error) {
                console.error('🔄 React: Manual test failed:', error);
                setIsConnected(false);
              }
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          <span className="text-green-800 text-sm font-medium">Database Connected</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🐝 Goblin Surprise
              </h1>
              <p className="text-gray-600 text-sm">
                MTG Collection Rebuilding System
              </p>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-2">
                <button
                  onClick={() => setCurrentView('upload')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    currentView === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <ConnectionStatus />

        {currentView === 'upload' ? (
          <>
            {/* Upload Mode Toggle */}
            <section className="mb-8">
              <UploadModeToggle
                mode={uploadMode}
                onModeChange={setUploadMode}
                disabled={!isConnected}
              />
            </section>

            {/* File Upload Section */}
            <section className="mb-8">
              {uploadMode === 'contribution' ? (
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadStart={handleUploadStart}
                  disabled={!isConnected}
                />
              ) : (
                <RequirementsUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadStart={handleUploadStart}
                  disabled={!isConnected}
                />
              )}
            </section>

            {/* Dashboard Grid for Upload View */}
            {isConnected && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ProgressSummary />
                <RecentContributions />
              </div>
            )}
          </>
        ) : (
          /* Dashboard View */
          <Dashboard />
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <section>
            <UploadResults
              results={uploadResults}
              onClear={clearResults}
            />
          </section>
        )}

        {/* Instructions */}
        {uploadResults.length === 0 && !uploading && (
          <section className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ready to rebuild Sam's collection!
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  Upload your MTGO .dek files to contribute cards to the collection.
                </p>
                <p>
                  Each upload will be processed and cards will be added to our shared database.
                </p>
                <p className="text-sm">
                  This is the MVP version - we'll add more features like progress tracking and export soon!
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Debug Section (only in development) */}
        {process.env.NODE_ENV === 'development' && isConnected && (
          <section className="mt-12 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              🛠️ Development Tools
            </h3>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  try {
                    await DatabaseService.clearAllData();
                    alert('All test data cleared!');
                    setUploadResults([]);
                  } catch (error) {
                    alert('Failed to clear data: ' + error);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
              >
                Clear All Data
              </button>
              <button
                onClick={() => {
                  const sampleContent = 'Test content for .dek file parsing';
                  const blob = new Blob([sampleContent], { type: 'text/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sample-deck.dek';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm ml-2"
              >
                Download Sample .dek
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;