import React, { useState, useEffect } from 'react';
import type { OutlineSection } from '../types';
import { CloseIcon } from './icons';

interface SectionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: OutlineSection[];
  onGenerate: (selectedIds: number[]) => void;
  title: string;
}

export const SectionSelectionModal: React.FC<SectionSelectionModalProps> = ({ isOpen, onClose, sections, onGenerate, title }) => {
  const [selected, setSelected] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    // Reset to default when modal is opened with sections
    if (isOpen && sections.length > 0) {
      setSelected(new Set([1]));
    }
  }, [isOpen, sections]);

  const handleToggle = (index: number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleGenerateClick = () => {
    onGenerate(Array.from(selected));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-brand-secondary/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-primary">{title}</h2>
          <button onClick={onClose} className="text-brand-secondary hover:text-brand-primary">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {sections.map(section => (
            <div key={section.index} className="flex items-center bg-brand-bg p-3 rounded-md border border-transparent has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/10 transition-colors">
              <input
                type="checkbox"
                id={`section-${section.index}`}
                checked={selected.has(section.index)}
                onChange={() => handleToggle(section.index)}
                className="h-5 w-5 rounded bg-brand-surface border-brand-secondary/50 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor={`section-${section.index}`} className="ml-3 text-brand-text cursor-pointer">
                <span className="font-semibold">{section.index}.</span> {section.title}
              </label>
            </div>
          ))}
        </div>
        <div className="p-6 bg-brand-bg rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-primary font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleGenerateClick}
            disabled={selected.size === 0}
            className="py-2 px-4 rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Generate Prompts
          </button>
        </div>
      </div>
    </div>
  );
};