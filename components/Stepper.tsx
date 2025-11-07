
import React from 'react';
import type { View, GenerationStatus } from '../types';

interface StepperProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  generationStatus: GenerationStatus;
  isPaused: boolean;
  hasScript: boolean;
  hasAudioChunks: boolean;
  hasVeoPrompts: boolean;
  hasImagePrompts: boolean;
  hasGeneratedImages: boolean;
  hasSeo: boolean;
}

const steps: { id: View; name: string }[] = [
  { id: 'input', name: 'Input' },
  { id: 'research', name: 'Research' },
  { id: 'outline', name: 'Outline' },
  { id: 'script', name: 'Script' },
  { id: 'audioChunks', name: 'Audio Chunks' },
  { id: 'imagePrompts', name: 'Image Prompts' },
  { id: 'imageGeneration', name: 'Image Generation' },
  { id: 'veoPrompts', name: 'Veo Prompts' },
  { id: 'seo', name: 'SEO' },
];

export const Stepper: React.FC<StepperProps> = ({ currentView, setCurrentView, generationStatus, isPaused, hasScript, hasAudioChunks, hasVeoPrompts, hasImagePrompts, hasGeneratedImages, hasSeo }) => {
  if (generationStatus === 'idle' && currentView === 'input') return null;

  const getIsDisabled = (stepId: View): boolean => {
    // During generation, you can't restart by clicking 'Input'.
    if ((generationStatus === 'processing' || isPaused) && stepId === 'input') {
        return true;
    }
    
    // Check if the content for a specific step is available
    switch (stepId) {
      case 'research':
      case 'outline':
      case 'script':
        return !hasScript;
      case 'audioChunks':
        return !hasAudioChunks;
      case 'veoPrompts':
        return !hasVeoPrompts;
      case 'imagePrompts':
        return !hasImagePrompts;
      case 'imageGeneration':
        return !hasImagePrompts; // Enabled once prompts are ready
      case 'seo':
        return !hasSeo;
      default: // for 'input' when not generating
        return false;
    }
  };


  const stepClasses = (stepId: View) => {
    const isActive = currentView === stepId;
    const isDisabled = getIsDisabled(stepId);

    let baseClasses = 'px-5 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap';
    if (isDisabled) {
      baseClasses += ' text-gray-600 cursor-not-allowed';
    } else if (isActive) {
      baseClasses += ' bg-brand-primary text-brand-bg cursor-default';
    } else {
      baseClasses += ' text-brand-secondary hover:bg-brand-secondary/20 cursor-pointer';
    }
    return baseClasses;
  };
  
  const isVisible = (stepId: View) => {
      if (stepId === 'audioChunks' && !hasAudioChunks && currentView !== 'audioChunks') return false;
      if (stepId === 'veoPrompts' && !hasVeoPrompts && currentView !== 'veoPrompts') return false;
      if (stepId === 'imagePrompts' && !hasImagePrompts && currentView !== 'imagePrompts') return false;
      if (stepId === 'imageGeneration' && !hasImagePrompts && currentView !== 'imageGeneration') return false;
      if (stepId === 'seo' && !hasSeo && currentView !== 'seo') return false;
      return true;
  }

  return (
    <nav className="flex justify-center items-center space-x-3 sm:space-x-4 bg-brand-bg p-2 rounded-lg mb-6 border border-brand-secondary/20 overflow-x-auto">
      {steps.map(step => {
        if (!isVisible(step.id)) {
          return null;
        }
        return (
          <button
            key={step.id}
            onClick={() => !getIsDisabled(step.id) && setCurrentView(step.id)}
            className={stepClasses(step.id)}
            disabled={getIsDisabled(step.id)}
            aria-current={currentView === step.id ? 'page' : undefined}
          >
            {step.name}
          </button>
        )
      })}
    </nav>
  );
};
