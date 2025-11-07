
import React from 'react';
import type { AppView } from '../types';
import { SettingsIcon } from './icons';

interface AppHeaderProps {
    appView: AppView;
    setAppView: (view: AppView) => void;
    onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ appView, setAppView, onOpenSettings }) => {
    const navs: { id: AppView, name: string}[] = [
        { id: 'generator', name: 'Script Generation' },
        { id: 'contentSuite', name: 'Library' },
        { id: 'imageGenerator', name: 'Image Generation' },
    ];

    const navButtonClasses = (id: AppView) => {
        return `px-4 py-2 rounded-md font-medium transition-colors ${appView === id ? 'bg-brand-primary text-brand-bg' : 'text-brand-secondary hover:bg-brand-secondary/20'}`
    }

    return (
        <header className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
                <button 
                    onClick={onOpenSettings} 
                    className="p-2 rounded-full text-brand-secondary hover:bg-brand-secondary/20 hover:text-brand-primary transition-colors"
                    aria-label="API Key Settings"
                >
                    <SettingsIcon />
                </button>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-brand-primary tracking-tight">WWII Sleep Story Script Generator</h1>
            <p className="text-brand-secondary mt-2 text-lg">Crafting calm, historical narratives for restful nights.</p>
            <nav className="mt-8 flex justify-center items-center space-x-2 sm:space-x-4 bg-brand-bg p-2 rounded-lg border border-brand-secondary/20">
                {navs.map(nav => (
                    <button key={nav.id} onClick={() => setAppView(nav.id)} className={navButtonClasses(nav.id)}>
                        {nav.name}
                    </button>
                ))}
            </nav>
        </header>
    );
};
