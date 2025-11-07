import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { SpinnerIcon, DownloadIcon, RefreshIcon, EyeIcon, PlayIcon, PauseIcon } from './icons';
import type { ImageResult, ImageStatus } from '../types';

// Since JSZip is loaded from a script tag, we need to declare it for TypeScript
declare var JSZip: any;

// --- TYPES ---
interface ParsedPrompt {
  id: number;
  scene: string;
  prompt: string;
}

type ImageModel = 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001';

// --- ImageCard Component ---
const ImageCard: React.FC<{
  result: ImageResult;
  scene: string;
  onRegenerate: () => void;
  onPreview: (data: string) => void;
}> = ({ result, scene, onRegenerate, onPreview }) => {
  
  const handleDownload = () => {
    if (result.data) {
      const link = document.createElement('a');
      link.href = result.data;
      link.download = `${scene.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    switch (result.status) {
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center h-full text-brand-secondary">
            <SpinnerIcon />
            <p className="mt-2 text-sm">Generating...</p>
          </div>
        );
      case 'success':
        return (
          <img src={result.data} alt={scene} className="w-full h-full object-cover" />
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-2 text-center">
            <p className="font-bold text-sm">Failed</p>
            <p className="text-xs mt-1">{result.error}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="aspect-video bg-brand-bg rounded-lg overflow-hidden relative group border border-brand-secondary/20">
      {renderContent()}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {result.status === 'success' && (
          <>
            <button onClick={() => onPreview(result.data!)} className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white" title="Preview"><EyeIcon /></button>
            <button onClick={handleDownload} className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white" title="Download"><DownloadIcon /></button>
          </>
        )}
        {(result.status === 'success' || result.status === 'error') && (
           <button onClick={onRegenerate} className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white" title="Regenerate"><RefreshIcon /></button>
        )}
      </div>
      <div className="absolute bottom-1 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
        {scene}
      </div>
    </div>
  );
};

// --- Main ImageGeneratorView Component ---
interface ImageGeneratorViewProps {
  ai: GoogleGenAI | null;
  initialPromptsText?: string;
  autoStart?: boolean;
  onGenerationComplete?: () => void;
  initialImageResults?: Record<number, ImageResult>;
  onImageResultsChange?: (results: Record<number, ImageResult>) => void;
}

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({ ai, initialPromptsText = '', autoStart = false, onGenerationComplete, initialImageResults, onImageResultsChange }) => {
  const [promptsText, setPromptsText] = useState(initialPromptsText);
  const [parsedPrompts, setParsedPrompts] = useState<ParsedPrompt[]>([]);
  const [imageResults, setImageResultsState] = useState<Record<number, ImageResult>>(initialImageResults || {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ImageModel>('gemini-2.5-flash-image');
  const generationQueueRef = useRef<number[]>([]);

  useEffect(() => {
    setPromptsText(initialPromptsText);
  }, [initialPromptsText]);

  useEffect(() => {
    setImageResultsState(initialImageResults || {});
  }, [initialImageResults]);

  const setImageResults = useCallback((updater: React.SetStateAction<Record<number, ImageResult>>) => {
    setImageResultsState(prevResults => {
      const newResults = typeof updater === 'function' ? updater(prevResults) : updater;
      if (onImageResultsChange) {
        onImageResultsChange(newResults);
      }
      return newResults;
    });
  }, [onImageResultsChange]);

  const CONCURRENCY_LIMIT = useMemo(() => {
    if (selectedModel === 'imagen-4.0-generate-001') {
      return 2; // Stricter RPM limit for Imagen 4
    }
    return 10; // Increased concurrency for Gemini Flash Image
  }, [selectedModel]);

  useEffect(() => {
    const parseBulkPrompts = (text: string) => {
      const prompts: ParsedPrompt[] = [];
      const regex = /Prompt\s*(\d+):\s*Scene_(\S+)\s*([\s\S]*?)(?=(?:Prompt\s*\d+:|$))/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        prompts.push({
          id: parseInt(match[1], 10),
          scene: `Scene_${match[2]}`,
          prompt: match[3].trim()
        });
      }
      if (prompts.length === 0 && text.trim()) { // Fallback for slightly different format
        const fallbackRegex = /Prompt\s*(\d+):\s*(.*?)\n([\s\S]*?)(?=(?:Prompt\s*\d+:|$))/g;
        let fallbackMatch;
        while ((fallbackMatch = fallbackRegex.exec(text)) !== null) {
          prompts.push({
            id: parseInt(fallbackMatch[1], 10),
            scene: fallbackMatch[2].trim(),
            prompt: fallbackMatch[3].trim()
          });
        }
      }

      setParsedPrompts(prompts);
    };
    parseBulkPrompts(promptsText);
  }, [promptsText]);
  
  const generateImage = useCallback(async (prompt: ParsedPrompt, retries = 2) => {
    if (!ai) return;

    setImageResults(prev => ({ ...prev, [prompt.id]: { status: 'generating' } }));

    for (let i = 0; i <= retries; i++) {
        try {
            const apiCallPromise = (async (): Promise<string> => {
                if (selectedModel === 'imagen-4.0-generate-001') {
                    const response = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: prompt.prompt,
                        config: {
                            numberOfImages: 1,
                            aspectRatio: '16:9',
                        },
                    });
                    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
                    if (base64ImageBytes) {
                        return `data:image/png;base64,${base64ImageBytes}`;
                    } else {
                        throw new Error("No image data returned from Imagen API.");
                    }
                } else { // default to gemini-2.5-flash-image
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [{ text: prompt.prompt }] },
                        config: {
                            responseModalities: [Modality.IMAGE],
                            imageConfig: {
                                aspectRatio: '16:9',
                            },
                        },
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
                    if (part && part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        return `data:image/png;base64,${base64ImageBytes}`;
                    } else {
                        throw new Error("No image data returned from Gemini API.");
                    }
                }
            })();

            const timeoutPromise = new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out after 45 seconds')), 45000)
            );

            const imageUrl = await Promise.race([apiCallPromise, timeoutPromise]);

            setImageResults(prev => ({ ...prev, [prompt.id]: { status: 'success', data: imageUrl } }));
            return; // Exit loop on success
        } catch (e) {
            console.error(`Attempt ${i + 1} failed for prompt ${prompt.id}:`, e);
            if (i === retries) {
                // Last attempt failed
                const error = e instanceof Error ? e : new Error('An unknown error occurred');
                setImageResults(prev => ({ ...prev, [prompt.id]: { status: 'error', error: error.message } }));
            } else {
                // Wait a bit before retrying
                await new Promise(res => setTimeout(res, 2000 * (i + 1)));
            }
        }
    }
  }, [ai, selectedModel, setImageResults]);

  const runSingleGeneration = useCallback((promptId: number) => {
    const prompt = parsedPrompts.find(p => p.id === promptId);
    if (prompt) {
      generateImage(prompt);
    }
  }, [parsedPrompts, generateImage]);


  // Effect to manage the generation queue
  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    let active = true;

    const runQueue = async () => {
      const worker = async () => {
        while (active && generationQueueRef.current.length > 0) {
          const promptId = generationQueueRef.current.shift();
          if (promptId) {
            const prompt = parsedPrompts.find(p => p.id === promptId);
            if (prompt) {
              await generateImage(prompt);
            }
          }
        }
      };

      const workers = Array(CONCURRENCY_LIMIT).fill(null).map(worker);
      await Promise.all(workers);

      if (active) { // If not paused
        setIsGenerating(false);
        if (onGenerationComplete && generationQueueRef.current.length === 0) {
          onGenerationComplete();
        }
      }
    };

    runQueue();

    return () => {
      active = false; // On pause or unmount, signal workers to stop
    };
  }, [isGenerating, parsedPrompts, generateImage, CONCURRENCY_LIMIT, onGenerationComplete]);


  const handleGenerateAll = useCallback(() => {
    if (parsedPrompts.length === 0) return;
    const initialResults: Record<number, ImageResult> = {};
    parsedPrompts.forEach(p => {
        initialResults[p.id] = { status: 'pending' };
    });
    setImageResults(initialResults);
    generationQueueRef.current = parsedPrompts.map(p => p.id);
    setIsGenerating(true);
  }, [parsedPrompts, setImageResults]);
  
  const handlePause = () => {
    setIsGenerating(false);
  };
  
  const handleResume = () => {
    const remainingIds = parsedPrompts
        .filter(p => !imageResults[p.id] || imageResults[p.id]?.status !== 'success')
        .map(p => p.id);
    
    if (remainingIds.length > 0) {
        generationQueueRef.current = remainingIds;
        setIsGenerating(true);
    }
  };

  // Effect to handle auto-starting generation
  useEffect(() => {
    // Only auto-start if the prop is true, generation isn't already running,
    // there are prompts to process, and there are no results yet (i.e., it's the very first run).
    if (autoStart && parsedPrompts.length > 0 && !isGenerating && Object.keys(imageResults).length === 0) {
      handleGenerateAll();
    }
  }, [autoStart, parsedPrompts, isGenerating, imageResults, handleGenerateAll]);

  const handleRegenerateFailed = () => {
      const failedIds = (Object.entries(imageResults) as [string, ImageResult][])
          .filter(([, result]) => result.status === 'error')
          .map(([id]) => parseInt(id, 10));
      generationQueueRef.current.push(...failedIds);
      setIsGenerating(true);
  }

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const successfulResults = (Object.entries(imageResults) as [string, ImageResult][]).filter(([, result]) => result.status === 'success' && result.data);

    for (const [id, result] of successfulResults) {
        const prompt = parsedPrompts.find(p => p.id === parseInt(id, 10));
        const sceneName = prompt ? prompt.scene.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `image_${id}`;
        
        const response = await fetch(result.data!);
        const blob = await response.blob();
        zip.file(`${sceneName}.png`, blob);
    }
    
    zip.generateAsync({ type: "blob" }).then((content: any) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "generated_images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  const { successCount, errorCount, pendingCount } = useMemo(() => {
    let success = 0, error = 0, pending = 0;
    const processedIds = new Set<number>();

    (Object.values(imageResults) as ImageResult[]).forEach(result => {
      if (result.status === 'success') success++;
      if (result.status === 'error') error++;
    });
    
    parsedPrompts.forEach(p => {
      if (!imageResults[p.id] || imageResults[p.id]?.status === 'pending') {
        pending++;
      }
    });

    return { successCount: success, errorCount: error, pendingCount: pending };
  }, [imageResults, parsedPrompts]);

  const totalProcessed = successCount + errorCount;
  const isPausable = isGenerating;
  const isResumable = !isGenerating && totalProcessed > 0 && totalProcessed < parsedPrompts.length;

  const renderMainButton = () => {
      let onClick = handleGenerateAll;
      let text = `Generate All (${parsedPrompts.length}) Images`;
      let icon = <PlayIcon />;

      if(isPausable) {
          onClick = handlePause;
          text = "Pause Generation";
          icon = <PauseIcon/>
      } else if (isResumable) {
          onClick = handleResume;
          text = "Resume Generation";
          icon = <PlayIcon />;
      }
      
      return (
          <button 
              onClick={onClick} 
              disabled={parsedPrompts.length === 0 || !ai}
              className="w-full bg-brand-accent text-brand-bg font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-yellow-500 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
              {isGenerating ? <SpinnerIcon /> : icon}
              {text}
          </button>
      );
  }

  return (
    <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                 <h2 className="text-xl font-bold text-brand-primary">1. Paste Image Prompts</h2>
                 <textarea 
                    value={promptsText}
                    onChange={(e) => setPromptsText(e.target.value)}
                    placeholder="Paste your bulk prompts here..."
                    rows={15}
                    className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors font-sans"
                 />
            </div>
             <div className="space-y-4">
                <h2 className="text-xl font-bold text-brand-primary">2. Generate Images</h2>
                <div className="bg-brand-bg p-4 rounded-lg border border-brand-secondary/20 space-y-4">
                    <p className="text-brand-secondary">Detected <span className="font-bold text-brand-primary">{parsedPrompts.length}</span> prompts.</p>
                    
                    <div>
                        <label htmlFor="image-model-select" className="block text-sm font-medium text-brand-secondary mb-2">Image Model</label>
                        <select 
                            id="image-model-select" 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value as ImageModel)}
                            disabled={isGenerating || totalProcessed > 0}
                            className="w-full bg-brand-bg border border-brand-secondary/30 rounded-md shadow-sm px-4 py-2 focus:ring-brand-primary focus:border-brand-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
                            <option value="imagen-4.0-generate-001">Imagen 4 (High Quality)</option>
                        </select>
                    </div>

                    {renderMainButton()}

                    {!ai && <div className="text-center text-yellow-400 bg-yellow-900/30 p-2 rounded-md text-sm"><strong>Warning:</strong> API key not set.</div>}
                
                    <div className="pt-4 border-t border-brand-secondary/20 space-y-2">
                         <p className="text-sm text-brand-secondary">Generated: <span className="font-bold text-green-400">{successCount} / {parsedPrompts.length}</span></p>
                         {errorCount > 0 && <p className="text-sm text-brand-secondary">Failed: <span className="font-bold text-red-400">{errorCount}</span></p>}

                         <div className="flex gap-2">
                             {errorCount > 0 && (
                                <button onClick={handleRegenerateFailed} disabled={isGenerating} className="flex-1 text-sm bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50">Regenerate Failed</button>
                             )}
                            <button onClick={handleDownloadAll} disabled={successCount === 0} className="flex-1 text-sm bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50">Download All as .zip</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <h2 className="text-xl font-bold text-brand-primary mb-4">Results</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto p-1 rounded-lg bg-brand-bg">
                {parsedPrompts.map(prompt => (
                    <ImageCard 
                        key={prompt.id} 
                        result={imageResults[prompt.id] || { status: 'pending' }}
                        scene={prompt.scene}
                        onRegenerate={() => runSingleGeneration(prompt.id)}
                        onPreview={setPreviewImage}
                    />
                ))}
                {parsedPrompts.length === 0 && !isGenerating && (
                    <div className="col-span-full text-center py-16 text-brand-secondary">
                        <p>Generated images will appear here.</p>
                    </div>
                )}
            </div>
        </div>
        
        {previewImage && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
        )}
    </div>
  );
};