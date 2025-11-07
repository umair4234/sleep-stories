
import React, { useState } from 'react';
import type { VeoPrompt, FormState } from '../types';
import { CopyIcon, CheckIcon, SpinnerIcon, RefreshIcon } from './icons';

interface VeoPromptsDisplayProps {
  formState: FormState;
  prompts: VeoPrompt[];
  status: 'idle' | 'processing' | 'error';
  error: string | null;
  onReset: () => void;
  onRegenerate: (targetCount: number) => void;
}

const PromptCard: React.FC<{
  prompt: VeoPrompt;
  isCopied: boolean;
  onCopy: () => void;
}> = ({ prompt, isCopied, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const promptLines = prompt.prompt.split('\n');
  const firstLine = promptLines[0];
  const hasMore = promptLines.length > 1;

  return (
    <div className={`bg-brand-bg p-4 rounded-lg border ${isCopied ? 'border-green-500' : 'border-brand-secondary/20'} space-y-3 transition-colors`}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-brand-primary">{prompt.scene}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card from expanding when copying
            onCopy();
          }}
          className="flex items-center space-x-2 text-sm bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-1 px-3 rounded-md transition-colors"
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          <span>{isCopied ? 'Copied' : 'Copy Prompt'}</span>
        </button>
      </div>

      <details className="group">
        <summary className="text-xs text-brand-secondary cursor-pointer hover:text-brand-primary list-none flex items-center">
            <span className="transition-transform duration-200 mr-1 group-open:rotate-90">&#9656;</span>
            Show Script Context
        </summary>
        <p className="mt-2 text-sm text-brand-text/80 bg-brand-surface p-2 rounded-md italic">
          "{prompt.text}"
        </p>
      </details>
      
      <div 
        className={`bg-brand-surface p-3 rounded-md ${hasMore ? 'cursor-pointer' : ''}`}
        onClick={hasMore ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <pre className="text-brand-text whitespace-pre-wrap font-sans text-sm leading-relaxed">
          <code>{isExpanded ? prompt.prompt : firstLine}</code>
        </pre>
        {hasMore && !isExpanded && (
          <span className="text-brand-primary text-xs font-semibold hover:underline mt-1 inline-block">
            ... Show more
          </span>
        )}
      </div>
    </div>
  );
};

export const VeoPromptsDisplay: React.FC<VeoPromptsDisplayProps> = ({ formState, prompts, status, error, onReset, onRegenerate }) => {
  const [copiedPrompts, setCopiedPrompts] = useState<Set<number>>(new Set());

  const handleCopy = (prompt: VeoPrompt) => {
    const textToCopy = `${prompt.scene}\n${prompt.prompt}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedPrompts(prev => new Set(prev).add(prompt.id));
    });
  };

  const handleCopyAll = () => {
    const allPromptsText = prompts.map(p => `${p.scene}\n${p.prompt}`).join('\n\n');
    navigator.clipboard.writeText(allPromptsText).then(() => {
      setCopiedPrompts(new Set(prompts.map(p => p.id)));
    });
  };
  
  const handleRegenerate = () => {
    const currentCount = prompts.length;
    const desiredCountStr = window.prompt(`Currently you have ${currentCount} prompts. How many would you like to generate?`, String(Math.max(currentCount, 15)));
    if (desiredCountStr) {
      const desiredCount = parseInt(desiredCountStr, 10);
      if (!isNaN(desiredCount) && desiredCount > 0) {
        onRegenerate(desiredCount);
      } else {
        alert("Please enter a valid number.");
      }
    }
  };

  if (status === 'processing') {
    return (
        <div className="text-center text-brand-secondary py-16">
            <div className="flex justify-center items-center text-xl text-brand-primary">
                <SpinnerIcon />
                <span className="ml-3">Generating Veo Prompts...</span>
            </div>
            <p className="mt-4">This may take a moment.</p>
        </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Veo Prompt Generation Failed</h2>
        <p className="text-brand-secondary mb-4">An error occurred:</p>
        <pre className="bg-brand-bg text-red-300 p-4 rounded-lg text-left text-sm overflow-x-auto">
          {error}
        </pre>
        <button
          onClick={onReset}
          className="mt-8 bg-brand-primary text-brand-bg font-bold py-2 px-6 rounded-lg hover:bg-brand-primary/80 transition-colors"
        >
          Back to Script
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
        <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-brand-primary">Veo 3 B-Roll Prompts</h2>
            {formState.title && <p className="text-brand-secondary mt-1 max-w-2xl mx-auto">{formState.title}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
                onClick={handleCopyAll}
                disabled={prompts.length === 0}
                className="sm:col-span-1 bg-brand-accent text-brand-bg font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
            >
                Copy All Prompts
            </button>
             <button
                onClick={handleRegenerate}
                disabled={prompts.length === 0}
                className="sm:col-span-1 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <RefreshIcon />
               <span>Regenerate</span>
            </button>
            <button
                onClick={onReset}
                className="sm:col-span-1 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
               Back to Script
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-1">
            {prompts.map(prompt => (
                <PromptCard 
                    key={prompt.id} 
                    prompt={prompt} 
                    isCopied={copiedPrompts.has(prompt.id)}
                    onCopy={() => handleCopy(prompt)}
                />
            ))}
        </div>
    </div>
  );
};
