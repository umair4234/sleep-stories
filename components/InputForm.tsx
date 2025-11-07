
import React from 'react';
import type { FormState } from '../types';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onGenerate: () => void;
  disabled: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode; optional?: boolean }> = ({ htmlFor, children, optional }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-brand-secondary mb-2">
    {children} {optional && <span className="text-gray-500">(Optional)</span>}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
    rows={3}
  />
);

export const InputForm: React.FC<InputFormProps> = ({ formState, setFormState, onGenerate, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: name === 'durationMin' ? (value ? parseInt(value, 10) : '') : value }));
  };

  const handleWpmChange = (wpm: number) => {
    setFormState(prev => ({...prev, wpm}));
  }
  
  const targetWords = formState.durationMin && formState.wpm ? formState.durationMin * formState.wpm : 0;

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Video Title</Label>
        <Input type="text" name="title" id="title" value={formState.title} onChange={handleChange} placeholder="e.g., The Siege of Bastogne" />
      </div>

      <div>
        <Label htmlFor="context" optional>Optional Context</Label>
        <TextArea name="context" id="context" value={formState.context} onChange={handleChange} placeholder="e.g., Focus on the perspective of a medic in the 101st Airborne..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="durationMin">Target Duration (minutes)</Label>
          <Input type="number" name="durationMin" id="durationMin" value={formState.durationMin} onChange={handleChange} placeholder="e.g., 20" min="1" />
        </div>
        <div>
          <Label htmlFor="wpm">Narration Speed (WPM)</Label>
          <div className="flex space-x-2 bg-brand-bg border border-brand-secondary/30 rounded-md p-1">
            {[140, 150, 160].map(wpmValue => (
              <button
                key={wpmValue}
                onClick={() => handleWpmChange(wpmValue)}
                className={`flex-1 py-1.5 rounded-md text-sm transition-colors ${formState.wpm === wpmValue ? 'bg-brand-primary text-brand-bg font-semibold' : 'hover:bg-brand-surface'}`}
              >
                {wpmValue}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center bg-brand-bg p-4 rounded-lg border border-brand-secondary/20">
        <p className="text-brand-secondary">Estimated Total Word Count</p>
        <p className="text-2xl font-bold text-brand-primary">{targetWords.toLocaleString()}</p>
      </div>

      <div className="pt-4">
        <button
          onClick={onGenerate}
          disabled={!formState.title || !formState.durationMin || disabled}
          className="w-full bg-brand-accent text-brand-bg font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
        >
          Generate Script
        </button>
      </div>
    </div>
  );
};
