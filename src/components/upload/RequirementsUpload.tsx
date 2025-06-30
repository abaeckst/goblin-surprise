import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Target, AlertCircle, FileText, User } from 'lucide-react';
import { DekParser } from '../../services/dekParser';
import { DatabaseService } from '../../services/supabase';
import type { UploadResult, UploadState } from '../../types/uploads';

interface RequirementsUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

export const RequirementsUpload: React.FC<RequirementsUploadProps> = ({
  onUploadComplete,
  onUploadStart,
  disabled = false
}) => {
  const [deckName, setDeckName] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    currentFile: null,
    error: null
  });

  const processFile = async (file: File): Promise<UploadResult> => {
    try {
      // Validate file
      const validation = DekParser.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Parse the .dek file
      setUploadState(prev => ({ ...prev, currentFile: file.name, progress: 25 }));
      const parsedDeck = await DekParser.parseFile(file);
      
      console.log('🎯 Parsed requirement deck result:', parsedDeck);
      
      if (parsedDeck.cards.length === 0) {
        const errorMsg = parsedDeck.errors.length > 0 
          ? `Parse errors: ${parsedDeck.errors.join(', ')}`
          : 'No valid cards found in file';
        throw new Error(errorMsg);
      }

      setUploadState(prev => ({ ...prev, progress: 50 }));

      // Insert requirement deck first
      const deckData = {
        deck_name: deckName.trim() || file.name.replace('.dek', ''),
        uploaded_by: uploaderName.trim()
      };

      const insertedDeck = await DatabaseService.insertRequirementDeck(deckData);
      setUploadState(prev => ({ ...prev, progress: 75 }));

      // Prepare requirement cards for database insertion
      const cardsToInsert = parsedDeck.cards.map(card => ({
        card_name: card.name,
        quantity: card.quantity,
        deck_id: insertedDeck.id
      }));

      // Insert requirement cards
      await DatabaseService.insertRequirementCards(cardsToInsert);
      setUploadState(prev => ({ ...prev, progress: 100 }));

      return {
        success: true,
        cardsProcessed: parsedDeck.cards.length,
        errors: parsedDeck.errors,
        deck: parsedDeck,
        contributorName: uploaderName.trim(),
        deckName: deckData.deck_name
      };

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!uploaderName.trim()) {
      setUploadState(prev => ({ ...prev, error: 'Please enter your name first' }));
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
      // Process files one at a time
      for (const file of acceptedFiles) {
        const result = await processFile(file);
        onUploadComplete(result);
      }

      // Reset form on success
      setDeckName('');
      setUploaderName('');
      setUploadState({
        uploading: false,
        progress: 0,
        currentFile: null,
        error: null
      });

    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        currentFile: null,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }, [deckName, uploaderName, onUploadComplete, onUploadStart, processFile]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.dek'],
      'application/xml': ['.dek']
    },
    multiple: false, // Requirements upload typically one deck at a time
    disabled: disabled || uploadState.uploading || !uploaderName.trim(),
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const clearError = () => {
    setUploadState(prev => ({ ...prev, error: null }));
  };

  const isReady = uploaderName.trim() && !uploadState.uploading && !disabled;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border-l-4 border-purple-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Target className="h-6 w-6 text-purple-600" />
        Upload Target Deck Requirements
        {disabled && <span className="text-red-500 text-sm ml-2">(Database not connected)</span>}
      </h2>

      {/* Uploader Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline h-4 w-4 mr-1" />
          Your Name (required)
        </label>
        <input
          type="text"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          disabled={uploadState.uploading}
          required
        />
      </div>

      {/* Deck Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Deck Name (optional)
        </label>
        <input
          type="text"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="Leave blank to use filename"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          disabled={uploadState.uploading}
        />
      </div>

      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 min-h-[200px] flex items-center justify-center
          ${isDragActive 
            ? 'border-purple-500 bg-purple-50' 
            : isReady 
              ? 'border-purple-300 hover:border-purple-400 hover:bg-purple-50 bg-gray-50' 
              : 'border-gray-300 bg-gray-100 cursor-not-allowed'
          }
          ${uploadState.uploading ? 'pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadState.uploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Processing {uploadState.currentFile || 'file'}...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{uploadState.progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FileText className={`h-12 w-12 ${isReady ? 'text-purple-400' : 'text-gray-300'}`} />
            </div>
            <div>
              <p className={`text-lg ${isReady ? 'text-gray-600' : 'text-gray-400'}`}>
                {isDragActive 
                  ? 'Drop requirement deck here...' 
                  : isReady
                    ? 'Drag and drop target deck .dek file here, or click to browse'
                    : 'Enter your name first to enable file upload'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                One deck file • Max 5MB
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
      <div className="mt-6 text-xs text-gray-500 space-y-1 bg-purple-50 p-3 rounded border border-purple-200">
        <p className="font-medium text-purple-700">Requirements Upload:</p>
        <p>• Upload MTGO .dek files that represent your target deck builds</p>
        <p>• These define what cards you need to complete your collection</p>
        <p>• Cards from multiple requirement decks use MAX quantity logic</p>
        <p>• Use a separate upload for each target deck configuration</p>
      </div>
    </div>
  );
};