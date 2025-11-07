
import React from 'react';
import { PauseIcon, PlayIcon, SpinnerIcon } from './icons';

interface ProgressBarProps {
  message: string;
  value: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  isRateLimited: boolean;
  rateLimitMessage: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ message, value, isPaused, onPause, onResume, isRateLimited, rateLimitMessage }) => {
  
  if (isRateLimited) {
    return (
      <div className="space-y-4 my-4 text-center p-4 bg-yellow-900/30 rounded-lg">
        <div className="flex justify-center items-center text-yellow-300">
          <SpinnerIcon />
          <p className="text-lg ml-3">{rateLimitMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-4">
      <div className="text-center">
        <p className="text-lg text-brand-primary">{message}</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-full bg-brand-bg rounded-full h-4 border border-brand-secondary/20">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${value}%` }}
          ></div>
        </div>
        {message.toLowerCase().includes('failed') ? null : isPaused ? (
          <button onClick={onResume} className="p-2 rounded-full bg-brand-secondary/20 hover:bg-brand-secondary/40 transition-colors" aria-label="Resume Generation">
            <PlayIcon />
          </button>
        ) : (
          <button onClick={onPause} className="p-2 rounded-full bg-brand-secondary/20 hover:bg-brand-secondary/40 transition-colors" aria-label="Pause Generation">
            <PauseIcon />
          </button>
        )}
      </div>
    </div>
  );
};
