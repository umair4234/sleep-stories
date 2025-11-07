import React, { useState, useEffect } from 'react';
import type { ThumbnailPrompt } from '../types';
import { CloseIcon, SpinnerIcon, CopyIcon, CheckIcon } from './icons';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialHeadings: string[];
  generatedPrompts: ThumbnailPrompt[] | null;
  status: 'idle' | 'processing' | 'error';
  onGenerate: (
    headings: string[],
    refinement?: { previousPrompts: ThumbnailPrompt[]; instructions: string }
  ) => void;
  error: string | null;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center space-x-2 text-sm bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-1 px-3 rounded-md transition-colors"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

export const ThumbnailModal: React.FC<ThumbnailModalProps> = ({
  isOpen,
  onClose,
  title,
  initialHeadings,
  generatedPrompts,
  status,
  onGenerate,
  error,
}) => {
  const [editableHeadings, setEditableHeadings] = useState(initialHeadings);
  const [refinementInstructions, setRefinementInstructions] = useState('');


  useEffect(() => {
    if (isOpen) {
      setEditableHeadings(initialHeadings);
      setRefinementInstructions(''); // Reset instructions when modal is opened
    }
  }, [isOpen, initialHeadings]);

  const handleHeadingChange = (index: number, value: string) => {
    const newHeadings = [...editableHeadings];
    newHeadings[index] = value;
    setEditableHeadings(newHeadings);
  };
  
  const handleGenerateClick = () => {
      onGenerate(editableHeadings.filter(h => h.trim() !== ''));
  }

  const handleRegenerateClick = () => {
      if (generatedPrompts) {
          onGenerate(editableHeadings.filter(h => h.trim() !== ''), {
              previousPrompts: generatedPrompts,
              instructions: refinementInstructions
          });
      }
  }

  const renderContent = () => {
    if (status === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <SpinnerIcon />
          <p className="mt-4 text-lg text-brand-primary">Generating Thumbnail Prompts...</p>
          <p className="text-brand-secondary">This may take a moment.</p>
        </div>
      );
    }

    if (status === 'error') {
        return (
            <div className="p-6 text-center">
                <h3 className="text-lg font-bold text-red-400 mb-2">Generation Failed</h3>
                <p className="text-brand-secondary mb-4 text-sm">An error occurred:</p>
                <pre className="bg-brand-bg text-red-300 p-3 rounded-lg text-left text-xs overflow-x-auto mb-6">
                    {error}
                </pre>
                <button
                    onClick={generatedPrompts ? handleRegenerateClick : handleGenerateClick}
                    className="py-2 px-4 rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-yellow-500"
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (generatedPrompts) {
      return (
        <>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {generatedPrompts.map((p, i) => (
                    <div key={i} className="bg-brand-bg p-4 rounded-lg border border-brand-secondary/20 space-y-3">
                         <div className="flex justify-between items-center">
                            <h4 className="font-bold text-brand-primary bg-brand-secondary/20 px-2 py-1 rounded text-sm">{p.label}</h4>
                            <CopyButton textToCopy={p.prompt} />
                        </div>
                        <p className="text-brand-text whitespace-pre-wrap font-sans text-sm leading-relaxed">{p.prompt}</p>
                    </div>
                ))}
                <div className="pt-4 border-t border-brand-secondary/20">
                     <label htmlFor="refinement" className="block text-sm font-medium text-brand-secondary mb-2">Instructions for Refinement</label>
                     <textarea
                        id="refinement"
                        value={refinementInstructions}
                        onChange={(e) => setRefinementInstructions(e.target.value)}
                        placeholder="e.g., Make it a close-up on the child's face, show a bombed city in the background..."
                        rows={3}
                        className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                     />
                </div>
            </div>
            <div className="p-6 bg-brand-bg rounded-b-lg flex justify-end gap-4">
                <button 
                    onClick={handleRegenerateClick} 
                    disabled={!refinementInstructions.trim()}
                    className="py-2 px-4 rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Regenerate
                </button>
            </div>
        </>
      );
    }
    
    return (
      <>
        <div className="p-6 space-y-4">
          <p className="text-brand-secondary text-sm">
            The first 2-3 headings of your script are used to generate relevant thumbnail ideas. You can edit them below if needed.
          </p>
          {editableHeadings.map((heading, index) => (
             <input
                key={index}
                type="text"
                value={heading}
                onChange={(e) => handleHeadingChange(index, e.target.value)}
                className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
             />
          ))}
          {editableHeadings.length === 0 && (
              <p className="text-center text-brand-secondary py-4">No headings found. Prompts will be based on the title.</p>
          )}
        </div>
        <div className="p-6 bg-brand-bg rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleGenerateClick}
            disabled={editableHeadings.filter(h => h.trim() !== '').length === 0}
            className="py-2 px-4 rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Generate
          </button>
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-brand-secondary/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-primary">Generate Thumbnail Prompts</h2>
          <button onClick={onClose} className="text-brand-secondary hover:text-brand-primary">
            <CloseIcon />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
