
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeyInput(currentApiKey || '');
    }
  }, [isOpen, currentApiKey]);

  const handleSaveClick = () => {
    if (keyInput.trim()) {
      onSave(keyInput.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-brand-secondary/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-primary">Gemini API Key</h2>
          <button onClick={onClose} className="text-brand-secondary hover:text-brand-primary">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-brand-secondary text-sm">
            Your API key is stored locally in your browser and is never sent to our servers.
            You can get your API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline hover:text-brand-accent">Google AI Studio</a>.
          </p>
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-brand-secondary mb-2">
              Enter your API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>
        </div>
        <div className="p-6 bg-brand-bg rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!keyInput.trim()}
            className="py-2 px-4 rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};
