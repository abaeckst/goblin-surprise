import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, FileText, User, Clock } from 'lucide-react';
import { DeckParser } from '../../services/deckParser';
import { DatabaseService } from '../../services/supabase';
import { UploadConfirmation } from './UploadConfirmation';
import type { UploadResult, UploadState } from '../../types/uploads';

interface FileUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadStart,
  disabled = false
}) => {
  const [contributorName, setContributorName] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    currentFile: null,
    error: null
  });
  const [lastUploadTime, setLastUploadTime] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (lastUploadTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastUploadTime;
        const remaining = Math.max(0, 60000 - elapsed); // 60 seconds
        setCooldownRemaining(Math.ceil(remaining / 1000));
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100); // Update every 100ms for smooth countdown

      return () => clearInterval(interval);
    }
  }, [lastUploadTime]);

  const processFile = async (file: File): Promise<UploadResult> => {
    try {
      // Validate file
      const validation = DeckParser.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Parse the deck file
      setUploadState(prev => ({ ...prev, currentFile: file.name, progress: 25 }));
      const parsedDeck = await DeckParser.parseFile(file);
      
      console.log('🎯 Parsed deck result:', parsedDeck);
      
      if (parsedDeck.cards.length === 0) {
        const errorMsg = parsedDeck.errors.length > 0 
          ? `Parse errors: ${parsedDeck.errors.join(', ')}`
          : 'No valid cards found in file';
        throw new Error(errorMsg);
      }

      setUploadState(prev => ({ ...prev, progress: 50 }));

      // Prepare cards for database insertion
      const cardsToInsert = parsedDeck.cards.map(card => ({
        card_name: card.name,
        quantity: card.quantity,
        contributor_name: contributorName.trim(),
        deck_filename: file.name
      }));

      // Insert into database
      setUploadState(prev => ({ ...prev, progress: 75 }));
      await DatabaseService.insertGatheredCards(cardsToInsert);

      setUploadState(prev => ({ ...prev, progress: 100 }));

      return {
        success: true,
        cardsProcessed: parsedDeck.cards.length,
        errors: parsedDeck.errors,
        deck: parsedDeck,
        contributorName: contributorName.trim()
      };

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!contributorName.trim()) {
      setUploadState(prev => ({ ...prev, error: 'Please enter your name first' }));
      return;
    }

    // Check cooldown
    if (cooldownRemaining > 0) {
      setUploadState(prev => ({ 
        ...prev, 
        error: `Please wait ${cooldownRemaining} seconds before uploading again to prevent duplicates` 
      }));
      return;
    }

    if (acceptedFiles.length === 0) return;

    setUploadState({
      uploading: true,
      progress: 0,
      currentFile: null,
      error: null
    });

    onUploadStart?.();

    try {
      let lastResult: UploadResult | null = null;
      
      // Process files one at a time
      for (const file of acceptedFiles) {
        const result = await processFile(file);
        onUploadComplete(result);
        lastResult = result;
      }

      // Don't reset form - show confirmation instead
      setUploadState({
        uploading: false,
        progress: 0,
        currentFile: null,
        error: null
      });
      
      // Set last upload time and show confirmation
      if (lastResult) {
        setLastUploadTime(Date.now());
        setLastUploadResult(lastResult);
        setShowConfirmation(true);
      }

    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        currentFile: null,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }, [contributorName, cooldownRemaining, onUploadComplete, onUploadStart]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.dek'],
      'application/xml': ['.dek'],
      'text/plain': ['.txt']
    },
    multiple: true,
    disabled: disabled || uploadState.uploading || !contributorName.trim() || cooldownRemaining > 0,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const clearError = () => {
    setUploadState(prev => ({ ...prev, error: null }));
  };

  const isReady = contributorName.trim() && !uploadState.uploading && !disabled && cooldownRemaining === 0;

  const handleUploadAnother = () => {
    setShowConfirmation(false);
    setContributorName('');
    setLastUploadResult(null);
  };

  // Show confirmation screen if upload was successful
  if (showConfirmation && lastUploadResult) {
    return (
      <UploadConfirmation
        contributorName={lastUploadResult.contributorName}
        deckName={lastUploadResult.deck.filename}
        cardCount={lastUploadResult.cardsProcessed}
        onUploadAnother={handleUploadAnother}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Upload className="h-6 w-6" />
        Upload MTGO Deck Files
        {disabled && <span className="text-red-500 text-sm ml-2">(Database not connected)</span>}
        {DatabaseService.testMode && <span className="text-yellow-600 text-sm ml-2">(Test Mode)</span>}
      </h2>

      {/* Contributor Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline h-4 w-4 mr-1" />
          Your Name (required)
        </label>
        <input
          type="text"
          value={contributorName}
          onChange={(e) => setContributorName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={uploadState.uploading}
          required
        />
      </div>

      {/* Cooldown Warning */}
      {cooldownRemaining > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-grow">
              <p className="text-yellow-800 font-medium">
                Please wait {cooldownRemaining} seconds before uploading again
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                This helps prevent accidental duplicate uploads. 
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-yellow-800 underline hover:text-yellow-900 ml-1"
                >
                  Refresh the page if this is in error
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 min-h-[200px] flex items-center justify-center
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : isReady 
              ? 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 bg-gray-50' 
              : 'border-gray-300 bg-gray-100 cursor-not-allowed'
          }
          ${uploadState.uploading || cooldownRemaining > 0 ? 'pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadState.uploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Processing {uploadState.currentFile || 'file'}...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{uploadState.progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FileText className={`h-12 w-12 ${isReady ? 'text-gray-400' : 'text-gray-300'}`} />
            </div>
            <div>
              <p className={`text-lg ${isReady ? 'text-gray-600' : 'text-gray-400'}`}>
                {isDragActive 
                  ? 'Drop deck files here...' 
                  : cooldownRemaining > 0
                    ? `Upload locked for ${cooldownRemaining} seconds`
                    : isReady
                      ? 'Drag and drop deck files here (.dek or .txt), or click to browse'
                      : 'Enter your name first to enable file upload'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports multiple files • Max 5MB per file
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File Rejection Messages */}
      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileRejections.map(({ file, errors }, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {file.name}: {errors.map(e => e.message).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="mt-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{uploadState.error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 font-medium text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p>• Upload MTGO deck files (.dek or .txt format)</p>
        <p>• Files will be parsed and cards added to the collection</p>
        <p>• Duplicate uploads are allowed and will add to totals</p>
      </div>
    </div>
  );
};