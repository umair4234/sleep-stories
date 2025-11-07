
import React, { useState } from 'react';
import type { GenerationState, FormState, GeneratedSection } from '../types';
import { CopyIcon, CheckIcon } from './icons';

interface ScriptDisplayProps {
  state: GenerationState;
  formState: FormState;
  onReset: () => void;
  onResume?: () => void;
  onViewAudioChunks: () => void;
  onGenerateVeoPrompts: () => void;
  onViewVeoPrompts: () => void;
  onGenerateImagePrompts: () => void;
  onViewImagePrompts: () => void;
  onViewImageGeneration: () => void;
  onGenerateSeo: () => void;
  onViewSeo: () => void;
  onGenerateThumbnails: () => void;
  onViewThumbnails: () => void;
}

const CopyButton: React.FC<{ textToCopy: string; children: React.ReactNode }> = ({ textToCopy, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!textToCopy}
      className="flex-1 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? 'Copied!' : children}</span>
    </button>
  );
};

const StatsDisplay: React.FC<{ script: string; wpm: number }> = ({ script, wpm }) => {
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const charCount = script.length;
    const minutes = Math.floor(wordCount / wpm);
    const seconds = Math.round(((wordCount / wpm) % 1) * 60);

    const StatCard: React.FC<{ value: string; label: string; subLabel?: string }> = ({ value, label, subLabel }) => (
        <div className="bg-brand-bg p-4 rounded-lg text-center border border-brand-secondary/20">
            <p className="text-2xl font-bold text-brand-primary">{value}</p>
            <p className="text-sm text-brand-secondary">{label}</p>
            {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
        </div>
    );

    return (
        <div className="grid grid-cols-3 gap-4">
            <StatCard value={wordCount.toLocaleString()} label="Words" />
            <StatCard value={charCount.toLocaleString()} label="Characters" />
            <StatCard value={`${minutes}m ${seconds}s`} label="Audio" subLabel={`(${wpm} wpm)`} />
        </div>
    );
}

export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ state, formState, onReset, onResume, onViewAudioChunks, onGenerateVeoPrompts, onViewVeoPrompts, onGenerateImagePrompts, onViewImagePrompts, onViewImageGeneration, onGenerateSeo, onViewSeo, onGenerateThumbnails, onViewThumbnails }) => {
  if (state.status === 'error') {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Generation Failed</h2>
        <p className="text-brand-secondary mb-4">An error occurred during script generation:</p>
        <pre className="bg-brand-bg text-red-300 p-4 rounded-lg text-left text-sm overflow-x-auto">
          {state.error}
        </pre>
        <div className="mt-8 flex justify-center items-center gap-4">
          {state.isPaused && onResume && (
              <button
                onClick={onResume}
                className="bg-brand-accent text-brand-bg font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Resume Generation
              </button>
          )}
          <button
            onClick={onReset}
            className="bg-brand-primary text-brand-bg font-bold py-2 px-6 rounded-lg hover:bg-brand-primary/80 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const hasAudioChunks = state.audioChunks.length > 0;
  const hasVeoPrompts = state.veoPrompts.length > 0;
  const hasImagePrompts = state.imagePrompts.length > 0;
  const hasSeo = state.seo !== null;
  const hasThumbnails = state.thumbnailPrompts && state.thumbnailPrompts.length > 0;

  return (
    <div className="space-y-6">
      {(state.status === 'complete' || state.status === 'idle' && state.finalScript) && <h2 className="text-2xl sm:text-3xl font-bold font-serif text-brand-primary text-center">Your Script is Ready!</h2>}
      
      {(state.status === 'complete' || state.status === 'idle' && state.finalScript) && <StatsDisplay script={state.finalScriptNoHeadings} wpm={formState.wpm} />}

      <div className="flex flex-col sm:flex-row gap-4">
        <CopyButton textToCopy={state.finalScript}>Copy Full Script (with headings)</CopyButton>
        <CopyButton textToCopy={state.finalScriptNoHeadings}>Copy Narrative Only</CopyButton>
      </div>
      
      <div className="bg-brand-bg p-4 sm:p-6 rounded-lg border border-brand-secondary/20 max-h-[60vh] overflow-y-auto">
        <div className="text-brand-text whitespace-pre-wrap font-serif text-base leading-relaxed">
          {state.finalScript ? state.finalScript : (
            <div className="text-center text-brand-secondary py-16">
              <p>Your script will appear here as it's generated...</p>
            </div>
          )}
        </div>
      </div>
      
      {(state.status === 'complete' || state.status === 'idle' && state.finalScript) && (
        <div className="text-center pt-4 border-t border-brand-secondary/20 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={hasSeo ? onViewSeo : onGenerateSeo}
            className="w-full bg-brand-secondary/30 text-brand-primary font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-brand-secondary/50 transition-all"
          >
            {hasSeo ? 'View Title & Description' : 'Generate Title & Description'}
          </button>
           <button
            onClick={hasThumbnails ? onViewThumbnails : onGenerateThumbnails}
            className="w-full bg-brand-secondary/30 text-brand-primary font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-brand-secondary/50 transition-all"
          >
            {hasThumbnails ? 'View Thumbnail Prompts' : 'Generate Thumbnail Prompts'}
          </button>
          {hasAudioChunks && (
             <button
                onClick={onViewAudioChunks}
                className="w-full bg-brand-secondary/30 text-brand-primary font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-brand-secondary/50 transition-all"
              >
                View Audio Chunks
              </button>
          )}
          <button
            onClick={hasImagePrompts ? onViewImagePrompts : onGenerateImagePrompts}
            className="w-full bg-brand-secondary/30 text-brand-primary font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-brand-secondary/50 transition-all"
          >
            {hasImagePrompts ? 'View Image Prompts' : 'Generate Image Prompts'}
          </button>
          <button
            onClick={hasVeoPrompts ? onViewVeoPrompts : onGenerateVeoPrompts}
            className="w-full bg-brand-secondary/30 text-brand-primary font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-brand-secondary/50 transition-all"
          >
            {hasVeoPrompts ? 'View Veo 3 Prompts' : 'Generate Veo 3 Prompts'}
          </button>
          {state.imageGeneratorPrompts && (
            <button
              onClick={onViewImageGeneration}
              className="w-full bg-brand-accent text-brand-bg font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105 col-span-1 sm:col-span-2"
            >
              {state.hasGeneratedImages ? 'View Generated Images' : 'View Image Generation Progress'}
            </button>
          )}
        </div>
      )}
      <div className="text-center pt-2">
         <button
            onClick={onReset}
            className="bg-brand-secondary/10 text-brand-secondary font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-brand-secondary/20 transition-all"
          >
            Create Another Script
          </button>
      </div>

    </div>
  );
};
