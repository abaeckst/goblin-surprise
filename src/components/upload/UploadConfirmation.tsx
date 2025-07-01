import React from 'react';
import { CheckCircle, Upload, RefreshCw } from 'lucide-react';
import { DatabaseService } from '../../services/supabase';

interface UploadConfirmationProps {
  contributorName: string;
  deckName: string;
  cardCount: number;
  onUploadAnother: () => void;
}

export const UploadConfirmation: React.FC<UploadConfirmationProps> = ({
  contributorName,
  deckName,
  cardCount,
  onUploadAnother
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              <div className="bg-green-500 rounded-full p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Upload Successful!</h2>
          <p className="text-gray-600">
            {DatabaseService.testMode 
              ? 'Test upload completed (no data saved)' 
              : 'Your contribution has been recorded'}
          </p>
          {DatabaseService.testMode && (
            <p className="text-yellow-600 text-sm font-medium">
              🧪 TEST MODE - Check console for details
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Contributor:</span>
            <span className="font-medium text-gray-800">{contributorName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Deck File:</span>
            <span className="font-medium text-gray-800">{deckName}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Cards Added:</span>
            <span className="font-bold text-green-600 text-lg">{cardCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onUploadAnother}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-5 w-5" />
            Upload Another Deck
          </button>
          
          <p className="text-sm text-gray-500">
            Or <button 
              onClick={() => window.location.reload()} 
              className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              refresh the page
            </button> to start fresh
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {DatabaseService.testMode 
              ? 'This was a test upload. No data was saved to the database.'
              : 'Thank you for helping rebuild the collection! Your contribution will be reflected in the dashboard immediately.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const Check: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 13l4 4L19 7"
    />
  </svg>
);