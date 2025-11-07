
import React, { useState } from 'react';
import type { ScriptProject, ProjectStatus } from '../types';

interface LibraryViewProps {
    projects: ScriptProject[];
    onView: (projectId: string) => void;
    onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
    onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<{ project: ScriptProject; onView: () => void; onUpdateStatus: (status: ProjectStatus) => void; onDelete: () => void; }> = ({ project, onView, onUpdateStatus, onDelete }) => {
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    const statusColors: Record<ProjectStatus, string> = {
        working: 'text-yellow-400 bg-yellow-900/50 border-yellow-400/50',
        paused: 'text-orange-400 bg-orange-900/50 border-orange-400/50',
        completed: 'text-green-400 bg-green-900/50 border-green-400/50',
        uploaded: 'text-blue-400 bg-blue-900/50 border-blue-400/50',
        failed: 'text-red-400 bg-red-900/50 border-red-400/50',
    }

    return (
        <div className="bg-brand-bg p-4 rounded-lg border border-brand-secondary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-grow">
                <h3 className="font-bold text-brand-primary text-lg">{project.formState.title}</h3>
                <div className="flex items-center gap-4 text-sm text-brand-secondary mt-1">
                    <p>{formatDate(project.createdAt)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[project.status]}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                {project.status === 'completed' && <button onClick={() => onUpdateStatus('uploaded')} className="text-xs py-1 px-2 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-colors">Move to Uploaded</button>}
                {project.status === 'uploaded' && <button onClick={() => onUpdateStatus('completed')} className="text-xs py-1 px-2 rounded bg-green-500/20 hover:bg-green-500/40 text-green-300 transition-colors">Move to Completed</button>}
                <button onClick={onDelete} className="text-xs py-1 px-2 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors">Delete</button>
                <button onClick={onView} className="py-2 px-4 rounded-lg bg-brand-accent text-brand-bg font-bold text-sm hover:bg-yellow-500 transition-colors">View</button>
            </div>
        </div>
    );
}

export const LibraryView: React.FC<LibraryViewProps> = ({ projects, onView, onUpdateStatus, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'completed' | 'uploaded'>('completed');
    
    const filteredProjects = projects.filter(p => {
        if (activeTab === 'completed') return ['working', 'completed', 'failed'].includes(p.status);
        return p.status === 'uploaded';
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const tabButtonClasses = (tabName: 'completed' | 'uploaded') => {
        return `px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tabName ? 'bg-brand-bg text-brand-primary border-b-2 border-brand-primary' : 'text-brand-secondary hover:bg-brand-secondary/10'}`
    }

    return (
        <div className="w-full">
            <div className="border-b border-brand-secondary/20 mb-6">
                <button onClick={() => setActiveTab('completed')} className={tabButtonClasses('completed')}>Completed</button>
                <button onClick={() => setActiveTab('uploaded')} className={tabButtonClasses('uploaded')}>Uploaded</button>
            </div>
            {filteredProjects.length > 0 ? (
                <div className="space-y-4">
                    {filteredProjects.map(p => (
                        <ProjectCard 
                            key={p.id} 
                            project={p}
                            onView={() => onView(p.id)}
                            onUpdateStatus={(status) => onUpdateStatus(p.id, status)}
                            onDelete={() => onDelete(p.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-brand-secondary">
                    <h3 className="text-xl font-semibold text-brand-text">No scripts here.</h3>
                    <p>Generated scripts will appear in your library.</p>
                </div>
            )}
        </div>
    );
};
