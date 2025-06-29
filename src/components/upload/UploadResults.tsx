import React from 'react';
import { CheckCircle, AlertTriangle, FileText, User, Hash } from 'lucide-react';
import type { UploadResult } from '../../types/uploads';
import type { ParsedDeckCard } from '../../types/cards';

interface UploadResultsProps {
  results: UploadResult[];
  onClear?: () => void;
}

export const UploadResults: React.FC<UploadResultsProps> = ({ results, onClear }) => {
  if (results.length === 0) return null;

  const totalCards = results.reduce((sum, result) => sum + result.cardsProcessed, 0);
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const successfulUploads = results.filter(r => r.success).length;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 space-y-4">
      {/* Summary Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Upload Results</h3>
          {onClear && (
            <button
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear Results
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Files Processed</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {successfulUploads} / {results.length}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Cards Added</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{totalCards}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Warnings</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{totalErrors}</p>
          </div>
        </div>
      </div>

      {/* Individual Upload Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <UploadResultCard key={index} result={result} />
        ))}
      </div>
    </div>
  );
};

interface UploadResultCardProps {
  result: UploadResult;
}

const UploadResultCard: React.FC<UploadResultCardProps> = ({ result }) => {
  const { success, deck, contributorName, cardsProcessed, errors } = result;

  return (
    <div className={`bg-white rounded-lg shadow-lg border-l-4 ${
      success ? 'border-green-500' : 'border-red-500'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {deck.filename}
              </h4>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <User className="h-3 w-3" />
                {contributorName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">{cardsProcessed}</p>
            <p className="text-xs text-gray-500">cards processed</p>
          </div>
        </div>
      </div>

      {/* Cards List */}
      {success && deck.cards.length > 0 && (
        <div className="p-4">
          <h5 className="font-medium text-gray-700 mb-3">Cards Added:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {deck.cards.map((card: ParsedDeckCard, cardIndex: number) => (
              <div
                key={cardIndex}
                className="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-800">{card.name}</span>
                <span className="text-gray-600 font-mono">×{card.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Warnings ({errors.length}):
          </h5>
          <ul className="space-y-1 text-sm text-yellow-700">
            {errors.map((error: string, errorIndex: number) => (
              <li key={errorIndex} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total cards: {deck.totalCards}</span>
          <span>Unique cards: {deck.cards.length}</span>
          <span>
            Status: {success ? (
              <span className="text-green-600 font-medium">✓ Success</span>
            ) : (
              <span className="text-red-600 font-medium">✗ Failed</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};