import React, { useState } from 'react';
import type { SeoResult } from '../types';
import { CopyIcon, CheckIcon, SpinnerIcon } from './icons';

interface SeoDisplayProps {
  seo: SeoResult | null;
  status: 'idle' | 'processing' | 'error';
  error: string | null;
  onReset: () => void;
}

const CopyButton: React.FC<{ textToCopy: string; children?: React.ReactNode }> = ({ textToCopy, children }) => {
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
      className="flex items-center space-x-2 text-sm bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {children && <span>{copied ? 'Copied' : children}</span>}
    </button>
  );
};

export const SeoDisplay: React.FC<SeoDisplayProps> = ({ seo, status, error, onReset }) => {
  if (status === 'processing') {
    return (
      <div className="text-center text-brand-secondary py-16">
        <div className="flex justify-center items-center text-xl text-brand-primary">
          <SpinnerIcon />
          <span className="ml-3">Generating Title & Description...</span>
        </div>
        <p className="mt-4">This may take a moment.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">SEO Generation Failed</h2>
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
  
  if (!seo) {
      return (
         <div className="text-center text-brand-secondary py-16">
            <p>Generate your SEO package to see titles and a description here.</p>
         </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-serif text-brand-primary text-center mb-4">Generated Titles</h2>
        <div className="space-y-3">
          {seo.titles.map((title, index) => (
            <div key={index} className="flex items-center justify-between bg-brand-bg p-3 rounded-lg border border-brand-secondary/20">
              <p className={`text-brand-text ${index === 0 ? 'italic opacity-80' : ''}`}>
                {title}
                {index === 0 && <span className="text-xs text-brand-secondary ml-2">(Original)</span>}
              </p>
              <CopyButton textToCopy={title} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold font-serif text-brand-primary text-center">Description & Hashtags</h2>
             <CopyButton textToCopy={seo.description}>Copy Description</CopyButton>
        </div>
        <div className="bg-brand-bg p-4 rounded-lg border border-brand-secondary/20">
          <p className="text-brand-text whitespace-pre-wrap">{seo.description}</p>
        </div>
      </div>
      
      <div className="text-center pt-4 border-t border-brand-secondary/20">
         <button
            onClick={onReset}
            className="bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-2 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors mx-auto"
        >
           Back to Script
        </button>
      </div>

    </div>
  );
};