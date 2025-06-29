import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface ProgressBarProps {
  completionPercentage: number;
  totalRequiredCards: number;
  totalGatheredCards: number;
  totalOutstandingCards: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completionPercentage,
  totalRequiredCards,
  totalGatheredCards,
  totalOutstandingCards,
  className = ''
}) => {
  const getProgressColor = () => {
    if (completionPercentage >= 100) return 'bg-green-500';
    if (completionPercentage >= 75) return 'bg-blue-500';
    if (completionPercentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressIcon = () => {
    if (completionPercentage >= 100) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (completionPercentage >= 50) return <Circle className="h-5 w-5 text-blue-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {getProgressIcon()}
          Collection Progress
        </h3>
        <span className="text-2xl font-bold text-gray-900">
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div 
          className={`h-4 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(completionPercentage, 100)}%` }}
        ></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{totalRequiredCards}</div>
          <div className="text-gray-500">Required</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalGatheredCards}</div>
          <div className="text-gray-500">Gathered</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalOutstandingCards}</div>
          <div className="text-gray-500">Outstanding</div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 text-center text-sm">
        {completionPercentage >= 100 ? (
          <span className="text-green-600 font-medium">🎉 Collection Complete!</span>
        ) : completionPercentage >= 75 ? (
          <span className="text-blue-600 font-medium">Almost there! Keep going!</span>
        ) : completionPercentage >= 50 ? (
          <span className="text-yellow-600 font-medium">Good progress! Halfway there!</span>
        ) : (
          <span className="text-red-600 font-medium">Getting started - upload more cards!</span>
        )}
      </div>
    </div>
  );
};