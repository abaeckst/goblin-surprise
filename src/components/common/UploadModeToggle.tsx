import React from 'react';
import { Upload, Target, DollarSign } from 'lucide-react';

export type UploadMode = 'contribution' | 'requirements' | 'monetary';

interface UploadModeToggleProps {
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  disabled?: boolean;
}

export const UploadModeToggle: React.FC<UploadModeToggleProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        onClick={() => onModeChange('contribution')}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center
          ${mode === 'contribution'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Upload className="h-4 w-4" />
        Contribute Cards
      </button>
      
      <button
        onClick={() => onModeChange('monetary')}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center
          ${mode === 'monetary'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <DollarSign className="h-4 w-4" />
        Log Donation
      </button>
      
      <button
        onClick={() => onModeChange('requirements')}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center
          ${mode === 'requirements'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Target className="h-4 w-4" />
        Set Requirements
      </button>
    </div>
  );
};