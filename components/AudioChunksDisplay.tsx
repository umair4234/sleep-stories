
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface AudioChunksDisplayProps {
  chunks: string[];
  onBack: () => void;
}

const ChunkCard: React.FC<{
  chunk: string;
  index: number;
}> = ({ chunk, index }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(chunk).then(() => {
      setIsCopied(true);
    });
  };
  
  const previewText = chunk.substring(0, 100);

  return (
    <div className={`p-4 rounded-lg border space-y-3 transition-colors ${isCopied ? 'bg-green-900/30 border-green-500/50' : 'bg-brand-bg border-brand-secondary/20'}`}>
      <div className="flex justify-between items-center">
        <h3 className={`font-bold ${isCopied ? 'text-green-300' : 'text-brand-primary'}`}>
            Chunk {index + 1}
        </h3>
        <button
          onClick={handleCopy}
          className={`flex items-center space-x-2 text-sm font-semibold py-1 px-3 rounded-md transition-colors ${isCopied ? 'bg-green-500/20 text-green-300' : 'bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary'}`}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="text-brand-text whitespace-pre-wrap font-sans text-sm leading-relaxed">
        {chunk.length > 100 && !isExpanded ? (
          <>
            {previewText}...
            <button onClick={() => setIsExpanded(true)} className="text-brand-primary hover:underline ml-2 font-semibold">
              Show more...
            </button>
          </>
        ) : (
          <p>{chunk}</p>
        )}
      </div>
       <div className="text-xs text-brand-secondary opacity-80 pt-2 border-t border-brand-secondary/10">
          {chunk.length.toLocaleString()} characters
       </div>
    </div>
  );
};

export const AudioChunksDisplay: React.FC<AudioChunksDisplayProps> = ({ chunks, onBack }) => {
  if (chunks.length === 0) {
      return (
          <div className="text-center text-brand-secondary py-16">
              <p>Audio chunks will appear here once the script is generated.</p>
              <button
                  onClick={onBack}
                  className="mt-4 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                  Back to Script
              </button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-brand-primary text-center">Script Audio Chunks</h2>
        <p className="text-center text-brand-secondary -mt-4">The script is split into chunks under 10,000 characters for TTS generation.</p>
        
        <div className="text-center">
             <button
                onClick={onBack}
                className="bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold py-2 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors mx-auto"
            >
               Back to Script
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-1">
            {chunks.map((chunk, index) => (
                <ChunkCard 
                    key={index} 
                    chunk={chunk}
                    index={index}
                />
            ))}
        </div>
    </div>
  );
};
