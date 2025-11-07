
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { InputForm } from './components/InputForm';
import { ProgressBar } from './components/ProgressBar';
import { ScriptDisplay } from './components/ScriptDisplay';
import { Stepper } from './components/Stepper';
import { SectionSelectionModal } from './components/SectionSelectionModal';
import { VeoPromptsDisplay } from './components/VeoPromptsDisplay';
import { SeoDisplay } from './components/SeoDisplay';
import { ThumbnailModal } from './components/ThumbnailModal';
import { AppHeader } from './components/AppHeader';
import { ImagePromptsDisplay } from './components/ImagePromptsDisplay';
import { ContentSuiteView } from './components/ContentSuiteView';
import { ImageGeneratorView } from './components/ImageGeneratorView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AudioChunksDisplay } from './components/AudioChunksDisplay';
import {
  PROMPT_A_RESEARCH_OUTLINE,
  PROMPT_B_HOOK,
  PROMPT_C_NEXT,
  PROMPT_I_BATCH_EXPAND,
  PROMPT_D_VEO_PROMPTS,
  PROMPT_E_SEO_PACKAGE,
  PROMPT_F_THUMBNAIL_PROMPTS,
  PROMPT_G_THUMBNAIL_REFINEMENT,
  PROMPT_H_IMAGE_PROMPTS,
  SEO_TITLE_EXAMPLES,
} from './constants';
import type { FormState, OutlineSection, GenerationState, GeneratedSection, View, VeoPrompt, SeoResult, ThumbnailPrompt, AppView, ImagePrompt, ScriptProject, ProjectStatus, ImageResult } from './types';
import { SpinnerIcon } from './components/icons';

const BATCH_SIZE = 4; // Batch multiple sections into one API call
const PROJECTS_STORAGE_KEY = 'ww2-script-projects';

const initialGenerationState: GenerationState = {
  status: 'idle',
  currentView: 'input',
  progressMessage: '',
  progressValue: 0,
  outline: [],
  researchText: '',
  outlineText: '',
  generatedSections: {},
  finalScript: '',
  finalScriptNoHeadings: '',
  audioChunks: [],
  veoPrompts: [],
  veoPromptSections: [],
  imagePrompts: [],
  imagePromptSections: [],
  seo: null,
  thumbnailPrompts: null,
  error: null,
  isPaused: false,
  imageGeneratorPrompts: '',
  hasGeneratedImages: false,
  generatedImages: {},
};

const initialFormState: FormState = {
  title: '',
  context: '',
  durationMin: 120,
  wpm: 140,
};

const API_KEY_STORAGE_KEY = 'gemini-api-key';

const robustJsonParse = (text: string) => {
    // Attempt to find a JSON block enclosed in ```json ... ```
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let parsableString = jsonMatch ? jsonMatch[1] : text.trim();

    // If no markdown block, try to find the start and end of a JSON object or array
    if (!jsonMatch) {
        const jsonStartIndex = parsableString.indexOf('{');
        const jsonEndIndex = parsableString.lastIndexOf('}');
        const arrayStartIndex = parsableString.indexOf('[');
        const arrayEndIndex = parsableString.lastIndexOf(']');

        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            parsableString = parsableString.substring(jsonStartIndex, jsonEndIndex + 1);
        } else if (arrayStartIndex !== -1 && arrayEndIndex > arrayStartIndex) {
            parsableString = parsableString.substring(arrayStartIndex, arrayEndIndex + 1);
        }
    }
    
    try {
        return JSON.parse(parsableString);
    } catch (e) {
        console.error("Robust JSON parsing failed.");
        console.error("Original text was:", text);
        console.error("Attempted to parse:", parsableString);
        throw new Error("Failed to parse JSON response from the model. The output format might be invalid.");
    }
};


const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [generationState, setGenerationState] = useState<GenerationState>(initialGenerationState);
  
  const [appView, setAppView] = useState<AppView>('generator');

  const [currentView, setCurrentView] = useState<View>('input');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [isVeoModalOpen, setIsVeoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [veoGenerationStatus, setVeoGenerationStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [imageGenerationStatus, setImageGenerationStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [seoGenerationStatus, setSeoGenerationStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [thumbnailGenerationStatus, setThumbnailGenerationStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const [projects, setProjects] = useState<ScriptProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const flashChatRef = useRef<Chat | null>(null);
  const generationController = useRef({ shouldStop: false, currentIndex: 0 });
  const retryTimerRef = useRef<number | null>(null);
  const autoPausedByNetwork = useRef(false);


  useEffect(() => {
    const userKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    setApiKey(userKey);
    try {
        const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
        }
    } catch (e) {
        console.error("Failed to load projects from localStorage", e);
    }
  }, []);

  // Effect to save the active project's state whenever it changes
  useEffect(() => {
    if (activeProjectId) {
      setProjects(prevProjects => {
        const projectExists = prevProjects.some(p => p.id === activeProjectId);
        if (!projectExists) return prevProjects; // Don't save if project was deleted

        const newProjects = prevProjects.map(p => {
            if (p.id === activeProjectId) {
                let newStatus: ProjectStatus = p.status;

                // Don't change status if it's already uploaded by the user,
                // unless it is actively being worked on again.
                if (p.status !== 'uploaded' || generationState.status === 'processing') {
                    if (generationState.status === 'complete') {
                        newStatus = 'completed';
                    } else if (generationState.isPaused) {
                        newStatus = 'paused';
                    } else if (generationState.status === 'error') {
                        newStatus = 'failed';
                    } else if (generationState.status === 'processing') {
                        newStatus = 'working';
                    }
                }
                
                return {
                    ...p,
                    formState,
                    generationState,
                    status: newStatus
                };
            }
            return p;
        });
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newProjects));
        } catch (e) {
            console.error("Failed to save projects to localStorage, likely due to size limits.", e);
            // Here you could potentially alert the user that their project might not be saved.
            // For now, we just log the error to avoid interrupting the user.
        }
        return newProjects;
      });
    }
  }, [generationState, formState, activeProjectId]);

  
  const handleSetCurrentView = useCallback((view: View) => {
    setCurrentView(view);
    setGenerationState(prev => ({ ...prev, currentView: view }));
  }, []);

  const ai = useMemo(() => {
    if (apiKey) {
      try {
        return new GoogleGenAI({ apiKey: apiKey });
      } catch (error) {
        console.error("Error initializing GoogleGenAI, likely an invalid API Key:", error);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setApiKey(null);
        setIsApiKeyModalOpen(true);
        return null;
      }
    }
    return null;
  }, [apiKey]);

  const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

  const parseOutlineFromResponse = (responseText: string): { outline: OutlineSection[], outlineText: string, researchText: string } => {
    const outlineSections: OutlineSection[] = [];
    
    const outlineSplit = responseText.split('### STEP 2 — OUTLINE CREATION');
    const researchText = outlineSplit[0] || "No research summary found.";
    const outlineAndAfter = outlineSplit[1] || '';

    const lines = outlineAndAfter.split('\n');
    const numberAndTitleRegex = /^\s*(\d+)\.\s*(.*)/;

    for (const line of lines) {
      const parts = line.split(/\s*[-—]\s*Target Word Count:/i);
      
      if (parts.length === 2) {
        const numberAndTitlePart = parts[0];
        const wordCountPart = parts[1];

        const numberAndTitleMatch = numberAndTitlePart.match(numberAndTitleRegex);
        const wordCount = parseInt(wordCountPart.trim(), 10);

        if (numberAndTitleMatch && !isNaN(wordCount)) {
          outlineSections.push({
            index: parseInt(numberAndTitleMatch[1], 10),
            title: numberAndTitleMatch[2].trim(),
            targetWords: wordCount,
          });
        }
      }
    }

    if (outlineSections.length === 0) {
        throw new Error("Failed to parse outline from Gemini's response. The structure might have changed.");
    }
    return { outline: outlineSections, outlineText: outlineAndAfter, researchText };
  };

  const parseSection = (responseText: string): { title: string; body: string } => {
    const lines = responseText.trim().split('\n');
    const titleWithNumber = lines.shift() || 'Untitled';
    const title = titleWithNumber.replace(/^\d+\.\s*/, '').trim();
    const body = lines.join('\n').trim();
    return { title, body };
  };
  
  const parseBatchExpansion = (responseText: string): { index: number; title: string; body: string }[] => {
    const sections = responseText.split('---END-OF-SECTION---').filter(s => s.trim().length > 10);
    return sections.map(sectionText => {
        const lines = sectionText.trim().split('\n');
        const titleLine = lines.shift() || 'Untitled';
        const body = lines.join('\n').trim();

        const titleMatch = titleLine.match(/^(\d+)\.\s*(.*)/);
        if (!titleMatch) {
            console.warn("Could not parse title line from batch response:", titleLine);
            return { index: -1, title: 'Parsing Failed', body: sectionText };
        }
        
        return {
            index: parseInt(titleMatch[1], 10),
            title: titleMatch[2].trim(),
            body,
        };
    }).filter(s => s.index !== -1);
  };


  const formatScripts = (title: string, sections: Record<number, GeneratedSection>) => {
    const sortedSections = Object.values(sections).sort((a, b) => a.index - b.index);
    const fullScript = `Title: ${title}\n\n` + sortedSections.map(s => `${s.index}. ${s.title}\n${s.body}`).join('\n\n');
    const narrativeOnly = sortedSections.map(s => s.body).join('\n\n');
    return { fullScript, narrativeOnly };
  };

  const splitScriptIntoChunks = (sections: GeneratedSection[]): string[] => {
      const MAX_CHUNK_LENGTH = 9900; // Leave a small buffer
      const chunks: string[] = [];

      if (sections.length === 0) return [];
      
      const sortedSections = [...sections].sort((a, b) => a.index - b.index);

      // Chunk 1: First heading's body, unsplit.
      if (sortedSections.length > 0) {
          chunks.push(sortedSections[0].body.trim());
      }

      // Chunk 2: Second heading's body, unsplit.
      if (sortedSections.length > 1) {
          chunks.push(sortedSections[1].body.trim());
      }

      // Combine the rest of the script
      const remainingText = sortedSections.slice(2).map(s => s.body.trim()).join('\n\n');

      if (remainingText.length === 0) {
          return chunks;
      }
      
      let textToProcess = remainingText;

      while (textToProcess.length > 0) {
          if (textToProcess.length <= MAX_CHUNK_LENGTH) {
              chunks.push(textToProcess);
              break;
          }

          let splitIndex = -1;
          const tempSlice = textToProcess.slice(0, MAX_CHUNK_LENGTH);

          // Look for paragraph breaks first, backwards from the max length
          splitIndex = tempSlice.lastIndexOf('\n\n');
          
          // If no paragraph break, look for sentence breaks
          if (splitIndex === -1) {
              const lastPeriod = tempSlice.lastIndexOf('.');
              const lastQuestion = tempSlice.lastIndexOf('?');
              const lastExclamation = tempSlice.lastIndexOf('!');
              splitIndex = Math.max(lastPeriod, lastQuestion, lastExclamation);
          }
          
          // If no good sentence break found, fall back to a word boundary
          if (splitIndex === -1 || splitIndex < MAX_CHUNK_LENGTH / 2) { // Avoid tiny chunks
               splitIndex = tempSlice.lastIndexOf(' ');
          }

          // If still no space, just cut it. Edge case.
          if (splitIndex === -1) {
              splitIndex = MAX_CHUNK_LENGTH;
          }

          const chunkToAdd = textToProcess.substring(0, splitIndex + 1).trim();
          if (chunkToAdd) {
              chunks.push(chunkToAdd);
          }
          textToProcess = textToProcess.substring(splitIndex + 1).trim();
      }

      return chunks.filter(c => c.length > 0);
  };


  const handleGenerateVeoPrompts = useCallback(async (selectedSectionIndexes: number[], generatedSections: Record<number, GeneratedSection>, isAutomated: boolean = false, targetPromptCount?: number) => {
    if (!ai || selectedSectionIndexes.length === 0) return;
    
    if (!isAutomated) {
        setIsVeoModalOpen(false);
        setVeoGenerationStatus('processing');
        handleSetCurrentView('veoPrompts');
    }
    setGenerationState(prev => ({...prev, veoPrompts: [], veoPromptSections: selectedSectionIndexes, error: null}));

    try {
        const sections = (Object.values(generatedSections) as GeneratedSection[]).sort((a,b) => a.index - b.index);
        
        let scriptContext = '';
        for(const index of selectedSectionIndexes) {
            const currentSection = sections.find(s => s.index === index);
            if (currentSection) {
              scriptContext += `\n\n--- HEADING ${currentSection.index}: ${currentSection.title} ---\n${currentSection.body}\n\n`;
            }
        }

        const wordCount = countWords(scriptContext);
        const finalTargetCount = targetPromptCount || Math.ceil(wordCount / 20);

        const prompt = PROMPT_D_VEO_PROMPTS
            .replace('{{SCRIPT_CONTEXT}}', scriptContext)
            .replace('{{TARGET_PROMPT_COUNT}}', String(finalTargetCount));
        
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const parsedPrompts: { scene: string, text: string, prompt: string }[] = robustJsonParse(result.text);
        
        const veoPromptsWithId: VeoPrompt[] = parsedPrompts.map((p, i) => ({ ...p, id: i }));
        
        setGenerationState(prev => ({ ...prev, veoPrompts: veoPromptsWithId }));
        if (!isAutomated) {
            setVeoGenerationStatus('idle');
        }

    } catch (e) {
        console.error(e);
        const error = e instanceof Error ? e : new Error('Failed to generate Veo prompts.');
        setGenerationState(prev => ({ ...prev, error: error.message }));
        if (!isAutomated) {
            setVeoGenerationStatus('error');
        } else {
            throw e;
        }
    }
  }, [ai, handleSetCurrentView]);
  
  const handleRegenerateVeoPrompts = (targetCount: number) => {
    handleGenerateVeoPrompts(generationState.veoPromptSections, generationState.generatedSections, false, targetCount);
  };

  const handleGenerateImagePrompts = useCallback(async (selectedSectionIndexes: number[], generatedSections: Record<number, GeneratedSection>, isAutomated: boolean = false, targetPromptCount?: number) => {
    if (!ai || selectedSectionIndexes.length === 0) return;

    if (!isAutomated) {
      setIsImageModalOpen(false);
      setImageGenerationStatus('processing');
      handleSetCurrentView('imagePrompts');
    }
    setGenerationState(prev => ({...prev, imagePrompts: [], imagePromptSections: selectedSectionIndexes, error: null}));

    try {
        const sections = (Object.values(generatedSections) as GeneratedSection[])
            .filter(s => selectedSectionIndexes.includes(s.index))
            .sort((a, b) => a.index - b.index);
        
        const allPrompts: ImagePrompt[] = [];
        const SECTIONS_PER_BATCH = 5;
        let promptIdCounter = 0;

        for (let i = 0; i < sections.length; i += SECTIONS_PER_BATCH) {
            if (generationController.current.shouldStop) return;

            const batch = sections.slice(i, i + SECTIONS_PER_BATCH);
            let scriptContext = '';
            for (const section of batch) {
                scriptContext += `\n\n--- HEADING ${section.index}: ${section.title} ---\n${section.body}\n\n`;
            }

            const wordCount = countWords(scriptContext);
            const batchTargetCount = Math.ceil(wordCount / 25);

            if (batchTargetCount === 0) continue;

            const prompt = PROMPT_H_IMAGE_PROMPTS
                .replace('{{SCRIPT_CONTEXT}}', scriptContext)
                .replace('{{TARGET_PROMPT_COUNT}}', String(batchTargetCount));
            
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            let parsedBatch: {scene: string, text: string, prompt: string}[] = [];
            try {
                parsedBatch = robustJsonParse(result.text);
            } catch (parseError) {
                console.error("Failed to parse image prompt JSON batch:", parseError);
                console.error("Problematic API response:", result.text);
                // Skip this batch if parsing fails, to allow the process to continue
                continue; 
            }

            const promptsWithId: ImagePrompt[] = parsedBatch.map((p) => ({
                ...p,
                id: promptIdCounter++,
            }));

            allPrompts.push(...promptsWithId);
            // Update state inside the loop for better UI feedback
            setGenerationState(prev => ({ ...prev, imagePrompts: [...prev.imagePrompts, ...promptsWithId] }));
        }

        if (!isAutomated) {
          setImageGenerationStatus('idle');
        }

    } catch (e) {
        console.error(e);
        const error = e instanceof Error ? e : new Error('Failed to generate Image prompts.');
        setGenerationState(prev => ({ ...prev, error: error.message }));
        if (!isAutomated) {
          setImageGenerationStatus('error');
        } else {
            throw e;
        }
    }
  }, [ai, handleSetCurrentView]);
  
  const handleRegenerateImagePrompts = (targetCount: number) => {
    handleGenerateImagePrompts(generationState.imagePromptSections, generationState.generatedSections, false, targetCount);
  };

  const handleGenerateSeo = useCallback(async (isAutomated: boolean = false) => {
    if (!ai) return;

    if (!isAutomated) {
        setSeoGenerationStatus('processing');
        handleSetCurrentView('seo');
    }
    setGenerationState(prev => ({...prev, seo: null, error: null}));

    try {
      const prompt = PROMPT_E_SEO_PACKAGE
        .replace('{{TITLE}}', formState.title)
        .replace('{{SCRIPT}}', generationState.finalScript)
        .replace('{{EXAMPLES}}', SEO_TITLE_EXAMPLES);

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const parsedSeo: { titles: string[], description: string, hashtags: string[] } = robustJsonParse(result.text);

      const finalSeo: SeoResult = {
        titles: [formState.title, ...parsedSeo.titles],
        description: `${parsedSeo.description}\n\n${parsedSeo.hashtags.join(' ')}`,
      };

      setGenerationState(prev => ({ ...prev, seo: finalSeo }));
      if (!isAutomated) {
        setSeoGenerationStatus('idle');
      }

    } catch (e) {
        console.error(e);
        const error = e instanceof Error ? e : new Error('Failed to generate SEO package.');
        setGenerationState(prev => ({ ...prev, error: error.message }));
        if (!isAutomated) {
            setSeoGenerationStatus('error');
        } else {
            throw e;
        }
    }
  }, [ai, formState.title, generationState.finalScript, handleSetCurrentView]);
  
  const handleGenerateThumbnails = useCallback(async (
    headings: string[],
    refinement?: { previousPrompts: ThumbnailPrompt[]; instructions: string },
    isAutomated: boolean = false
  ) => {
    if (!ai || (headings.length === 0 && !formState.title)) return;

    if (!isAutomated) {
        setThumbnailGenerationStatus('processing');
    }
    setGenerationState(prev => ({ ...prev, error: null, thumbnailPrompts: refinement ? prev.thumbnailPrompts : null }));

    try {
        const brandTextBlock = "WW2 HISTORY\n*FOR SLEEP*";
        let prompt = '';

        if (refinement && refinement.instructions) {
            prompt = PROMPT_G_THUMBNAIL_REFINEMENT
                .replace('{{title}}', formState.title)
                .replace('{{headings}}', JSON.stringify(headings))
                .replace('{{previous_prompts}}', JSON.stringify(refinement.previousPrompts))
                .replace('{{user_feedback}}', refinement.instructions)
                .replace(new RegExp('{{brand_text_block}}', 'g'), brandTextBlock);
        } else {
            prompt = PROMPT_F_THUMBNAIL_PROMPTS
                .replace('{{title}}', formState.title)
                .replace('{{headings}}', JSON.stringify(headings))
                .replace(new RegExp('{{brand_text_block}}', 'g'), brandTextBlock);
        }

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const parsedResult: { prompts: ThumbnailPrompt[] } = robustJsonParse(result.text);

        if (!parsedResult.prompts || parsedResult.prompts.length !== 3) {
            throw new Error("AI response did not contain exactly 3 prompts.");
        }

        setGenerationState(prev => ({ ...prev, thumbnailPrompts: parsedResult.prompts }));
        if (!isAutomated) {
            setThumbnailGenerationStatus('idle');
        }
    } catch (e) {
        console.error(e);
        const error = e instanceof Error ? e : new Error('Failed to generate thumbnail prompts.');
        setGenerationState(prev => ({ ...prev, error: error.message, thumbnailPrompts: null }));
        if (!isAutomated) {
            setThumbnailGenerationStatus('error');
        } else {
            throw e;
        }
    }
  }, [ai, formState.title]);

  const handleRateLimit = useCallback((outline: OutlineSection[], resumeIndex: number, attempt: number) => {
    const MAX_RETRIES = 5;
    if (attempt >= MAX_RETRIES) {
        setGenerationState(prev => ({ ...prev, status: 'error', error: 'API rate limit exceeded after multiple retries.', isPaused: true, progressMessage: 'Failed after multiple retries.' }));
        return;
    }

    const waitTimeMs = Math.pow(2, attempt) * 1000 + Math.random() * 2000; // Exponential backoff with jitter
    const waitTimeSec = Math.ceil(waitTimeMs / 1000);
    
    console.warn(`Rate limit hit. Retrying attempt ${attempt + 1} in ${waitTimeSec} seconds.`);
    
    setIsRateLimited(true);
    setGenerationState(prev => ({ ...prev, progressMessage: `Rate limit reached. Pausing...` }));

    let countdown = waitTimeSec;
    setRateLimitMessage(`Retrying in ${countdown} seconds...`);
    
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);

    retryTimerRef.current = window.setInterval(() => {
        countdown--;
        if (countdown > 0) {
            setRateLimitMessage(`Retrying in ${countdown} seconds...`);
        } else {
            if(retryTimerRef.current) clearInterval(retryTimerRef.current);
            retryTimerRef.current = null;
            setIsRateLimited(false);
            setRateLimitMessage('');
            console.log("Retrying generation...");
            // The function is memoized, so we need a way to call the latest version.
            // However, since App re-renders, the closure will be correct.
            expandAllSections(outline, resumeIndex, attempt + 1);
        }
    }, 1000);
  }, []); // Note: expandAllSections is a circular dependency, handled by useCallback rules.

  const expandAllSections = useCallback(async (outline: OutlineSection[], startIndex: number = 0, attempt: number = 0): Promise<boolean> => {
    if (!chatRef.current || !ai) return false;

    generationController.current.currentIndex = startIndex;
    const totalSections = outline.length;

    try {
      // --- Section 1 (Hook) with Pro ---
      if (startIndex === 0 && totalSections > 0) {
          const hookSection = outline[0];
          setGenerationState(prev => ({
              ...prev,
              progressMessage: `Expanding section 1/${totalSections} with Pro: "${hookSection.title}"`,
              progressValue: 15,
          }));

          const expansionResult = await chatRef.current!.sendMessage({ message: PROMPT_B_HOOK });
          const { title, body } = parseSection(expansionResult.text);
          const wordCount = countWords(body);
          setGenerationState(prev => {
              const newGeneratedSections = { ...prev.generatedSections, [1]: { index: 1, title, body, wordCount, targetWords: hookSection.targetWords }};
              const { fullScript, narrativeOnly } = formatScripts(formState.title, newGeneratedSections);
              return { ...prev, generatedSections: newGeneratedSections, finalScript: fullScript, finalScriptNoHeadings: narrativeOnly };
          });
          generationController.current.currentIndex = 1;
      }
      if (generationController.current.shouldStop) return false;

      // --- Section 2 with Pro ---
      if (startIndex <= 1 && generationController.current.currentIndex === 1 && totalSections > 1) {
          const section2 = outline[1];
          setGenerationState(prev => ({
              ...prev,
              progressMessage: `Expanding section 2/${totalSections} with Pro: "${section2.title}"`,
              progressValue: 15 + (1 / totalSections) * 70,
          }));

          const sectionToExpandStr = `${section2.index}. ${section2.title} - Target Words: ${section2.targetWords}`;
          const prompt = PROMPT_I_BATCH_EXPAND.replace('{{SECTIONS_TO_EXPAND}}', sectionToExpandStr);
          const expansionResult = await chatRef.current!.sendMessage({ message: prompt });
          const parsedSections = parseBatchExpansion(expansionResult.text);
          if (parsedSections.length === 0 && expansionResult.text.length > 10) {
               throw new Error("Failed to parse section 2 response.");
          }
          
          setGenerationState(prev => {
              const newGeneratedSections = { ...prev.generatedSections };
              const pSection = parsedSections[0];
              if (pSection) {
                  newGeneratedSections[pSection.index] = {
                      index: pSection.index, title: pSection.title, body: pSection.body,
                      wordCount: countWords(pSection.body), targetWords: section2.targetWords
                  };
              }
              const { fullScript, narrativeOnly } = formatScripts(formState.title, newGeneratedSections);
              return { ...prev, generatedSections: newGeneratedSections, finalScript: fullScript, finalScriptNoHeadings: narrativeOnly };
          });

          generationController.current.currentIndex = 2;
      }
      if (generationController.current.shouldStop) return false;

      // --- Sections 3+ with Flash ---
      if (generationController.current.currentIndex >= 2 && totalSections > 2) {
          if (!flashChatRef.current) {
              flashChatRef.current = ai.chats.create({
                  model: 'gemini-2.5-flash',
                  history: chatRef.current.history,
              });
          }
          
          while (generationController.current.currentIndex < totalSections && !generationController.current.shouldStop) {
              const batchStartIndex = generationController.current.currentIndex;
              const batchEndIndex = Math.min(batchStartIndex + BATCH_SIZE, totalSections);
              const batch = outline.slice(batchStartIndex, batchEndIndex);
              
              if (batch.length === 0) break;

              setGenerationState(prev => ({
                  ...prev,
                  progressMessage: `Expanding sections ${batch[0].index}-${batch[batch.length - 1].index} with Flash...`,
                  progressValue: 15 + (batchStartIndex / totalSections) * 70,
              }));

              const sectionsToExpandStr = batch.map(s => `${s.index}. ${s.title} - Target Words: ${s.targetWords}`).join('\n');
              const prompt = PROMPT_I_BATCH_EXPAND.replace('{{SECTIONS_TO_EXPAND}}', sectionsToExpandStr);
              
              const expansionResult = await flashChatRef.current!.sendMessage({ message: prompt });
              const parsedSections = parseBatchExpansion(expansionResult.text);

              if (parsedSections.length === 0 && expansionResult.text.length > 10) {
                   throw new Error("Failed to parse batch response from Flash model.");
              }

              setGenerationState(prev => {
                  const newGeneratedSections = { ...prev.generatedSections };
                  parsedSections.forEach(pSection => {
                      const outlineSection = outline.find(o => o.index === pSection.index);
                      if (outlineSection) {
                           newGeneratedSections[pSection.index] = {
                              index: pSection.index, title: pSection.title, body: pSection.body,
                              wordCount: countWords(pSection.body), targetWords: outlineSection.targetWords
                          };
                      }
                  });
                  const { fullScript, narrativeOnly } = formatScripts(formState.title, newGeneratedSections);
                  return { ...prev, generatedSections: newGeneratedSections, finalScript: fullScript, finalScriptNoHeadings: narrativeOnly };
              });

              generationController.current.currentIndex = batchEndIndex;
          }
      }
    } catch (e: any) {
        const errorMessage = e.message || e.toString();
        if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429") || errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE")) {
            handleRateLimit(outline, generationController.current.currentIndex, attempt);
            return false;
        } else {
          console.error("Error expanding sections:", e);
          let friendlyErrorMessage = 'An unknown error occurred during script expansion.';
          if (e instanceof Error) {
              if (e.message.includes("Failed to fetch")) {
                  friendlyErrorMessage = "A network error occurred. Please check your internet connection and try resuming.";
              } else if (e.message.includes("Failed to parse")) {
                  friendlyErrorMessage = "The AI returned an unexpected format for a script section. Please try resuming.";
              } else {
                  friendlyErrorMessage = e.message;
              }
          } else {
              friendlyErrorMessage = String(e);
          }
          setGenerationState(prev => ({ ...prev, status: 'error', error: friendlyErrorMessage, isPaused: true, progressMessage: 'Failed during script expansion.' }));
          return false;
        }
    }
      
    if (generationController.current.shouldStop) return false;

    return true;
  }, [ai, formState.title, handleRateLimit]);

  const formatImagePromptsForGenerator = (prompts: ImagePrompt[]): string => {
    return prompts.map(p => `Prompt ${p.id + 1}: Scene_${p.id + 1}\n${p.prompt}`).join('\n\n');
  };

  const handleUpdateImageResults = useCallback((newResults: Record<number, ImageResult>) => {
    setGenerationState(prev => ({
        ...prev,
        generatedImages: newResults,
    }));
  }, []);

  const runPostExpansionPipeline = useCallback(async () => {
    try {
        if (generationController.current.shouldStop) return;
        const getLatestState = () => new Promise<GenerationState>(resolve => setGenerationState(s => { resolve(s); return s; }));
        let currentState = await getLatestState();

        // Step 3: Audio chunks
        setGenerationState(prev => ({...prev, progressMessage: 'Step 3/7: Preparing audio chunks...', progressValue: 85}));
        const sortedSections = Object.values(currentState.generatedSections).sort((a,b) => a.index - b.index);
        const audioChunks = splitScriptIntoChunks(sortedSections);
        setGenerationState(prev => ({...prev, audioChunks}));
        if (generationController.current.shouldStop) return;

        // Step 4: SEO
        setGenerationState(prev => ({ ...prev, progressMessage: 'Step 4/7: Generating SEO package...', progressValue: 88 }));
        await handleGenerateSeo(true);
        if (generationController.current.shouldStop) return;
        currentState = await getLatestState();

        // Step 5: Veo Prompts (for section 1 only)
        setGenerationState(prev => ({...prev, progressMessage: 'Step 5/7: Generating Veo 3 prompts...', progressValue: 91}));
        const veoSectionIndexes = [1];
        if (currentState.outline.some(s => s.index === 1)) {
            await handleGenerateVeoPrompts(veoSectionIndexes, currentState.generatedSections, true, undefined);
        } else {
            console.warn("Section 1 not found for Veo prompt generation, skipping.");
        }
        if (generationController.current.shouldStop) return;
        currentState = await getLatestState();

        // Step 6: Image Prompts (for section 2 only)
        setGenerationState(prev => ({...prev, progressMessage: 'Step 6/7: Generating image prompts...', progressValue: 94}));
        const imageSectionIndexes = [2];
        if (currentState.outline.some(s => s.index === 2)) {
            await handleGenerateImagePrompts(imageSectionIndexes, currentState.generatedSections, true, undefined);
        } else {
            console.warn("Section 2 not found for Image prompt generation, skipping.");
        }
        currentState = await getLatestState(); // refresh state
        setGenerationState(prev => ({...prev, imageGeneratorPrompts: formatImagePromptsForGenerator(currentState.imagePrompts)}));
        if (generationController.current.shouldStop) return;

        // Step 7: Thumbnail Prompts
        setGenerationState(prev => ({ ...prev, progressMessage: 'Step 7/7: Generating thumbnail prompts...', progressValue: 98 }));
        const thumbnailHeadings = currentState.outline.slice(0, 3).map(s => s.title);
        await handleGenerateThumbnails(thumbnailHeadings, undefined, true);
        if (generationController.current.shouldStop) return;

        setGenerationState(prev => ({
            ...prev,
            status: 'complete',
            progressMessage: 'All assets generated!',
            progressValue: 100,
            currentView: 'script',
            isPaused: false,
        }));
    } catch (e) {
      console.error("Error during post-expansion pipeline:", e);
      let friendlyErrorMessage = 'An unknown error occurred during the final asset generation steps.';
      if (e instanceof Error) {
        if (e.message.includes("Failed to fetch")) {
            friendlyErrorMessage = "A network error occurred. Please check your internet connection and try resuming.";
        } else if (e.message.includes("Failed to parse JSON")) {
            friendlyErrorMessage = "The AI returned an unexpected format. Please try resuming, which may resolve the issue.";
        } else {
            friendlyErrorMessage = e.message;
        }
      } else {
          friendlyErrorMessage = String(e);
      }
      setGenerationState(prev => ({ ...prev, status: 'error', error: `Post-generation failed: ${friendlyErrorMessage}`, isPaused: true, progressMessage: 'Failed during final steps.' }));
    }
  }, [handleGenerateSeo, handleGenerateVeoPrompts, handleGenerateImagePrompts, handleGenerateThumbnails]);


  const runFullGeneration = useCallback(async (selectedOutline?: OutlineSection[]) => {
    if (!ai) {
      setIsApiKeyModalOpen(true);
      return;
    }
    
    generationController.current = { shouldStop: false, currentIndex: 0 };
    setGenerationState({
        ...initialGenerationState,
        status: 'processing',
        progressMessage: 'Initializing...',
        currentView: 'research',
    });
    setCurrentView('research');
    
    try {
        let outlineToUse = selectedOutline || [];

        if (outlineToUse.length === 0) {
            // Step 1: Research & Outline
            setGenerationState(prev => ({ ...prev, progressMessage: 'Step 1/2: Performing research and creating outline...', progressValue: 5 }));
            
            chatRef.current = ai.chats.create({ model: 'gemini-2.5-pro' });

            const targetWords = formState.durationMin * formState.wpm;
            const promptA = PROMPT_A_RESEARCH_OUTLINE
                .replace('{{TITLE}}', formState.title)
                .replace('{{CONTEXT}}', formState.context)
                .replace('{{DURATION_MIN}}', String(formState.durationMin))
                .replace('{{WPM}}', String(formState.wpm))
                .replace('{{TARGET_WORDS}}', String(targetWords));

            const result = await chatRef.current.sendMessage({ message: promptA });
            if (generationController.current.shouldStop) return;

            const { outline, outlineText, researchText } = parseOutlineFromResponse(result.text);
            outlineToUse = outline;
            setGenerationState(prev => ({ ...prev, outline, outlineText, researchText, progressValue: 10, currentView: 'outline' }));
            setCurrentView('outline');
        }
        
        if (generationController.current.shouldStop) return;

        // Step 2: Expand all sections
        setGenerationState(prev => ({ ...prev, progressMessage: 'Step 2/2: Expanding script sections...', progressValue: 15, currentView: 'script' }));
        setCurrentView('script');
        const expansionSuccess = await expandAllSections(outlineToUse, 0);

        if (!expansionSuccess || generationController.current.shouldStop) {
          if (!generationController.current.shouldStop) {
            console.error("Expansion failed or was stopped, not proceeding.");
          }
          return; 
        }

        await runPostExpansionPipeline();

    } catch (e) {
      console.error("Error during full generation:", e);
      let friendlyErrorMessage = 'An unknown error occurred during generation.';
      if (e instanceof Error) {
        if (e.message.includes("Failed to fetch")) {
            friendlyErrorMessage = "A network error occurred. Please check your internet connection and try again.";
        } else if (e.message.includes("Failed to parse outline")) {
            friendlyErrorMessage = "The AI returned an unexpected format for the outline. The model's output may have changed. Please try again with a slightly different prompt."
        } else {
            friendlyErrorMessage = e.message;
        }
      } else {
          friendlyErrorMessage = String(e);
      }
      setGenerationState(prev => ({ ...prev, status: 'error', error: friendlyErrorMessage, isPaused: true, progressMessage: 'Failed during generation.' }));
    }
  }, [ai, formState, expandAllSections, runPostExpansionPipeline]);
  
  const handleFormSubmit = useCallback(() => {
    const newProjectId = `ww2-script-${Date.now()}`;
    const newProject: ScriptProject = {
        id: newProjectId,
        formState,
        generationState: { ...initialGenerationState, status: 'processing' },
        createdAt: new Date().toISOString(),
        status: 'working'
    };
    
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProjectId);
    runFullGeneration();
  }, [formState, runFullGeneration]);

  const handlePause = useCallback(() => {
    generationController.current.shouldStop = true;
    if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
    }
    setIsRateLimited(false);
    setRateLimitMessage('');
    setGenerationState(prev => ({ ...prev, isPaused: true, progressMessage: 'Generation paused.' }));
  }, []);

  const handleResume = useCallback(() => {
    generationController.current.shouldStop = false;
    setGenerationState(prev => ({ ...prev, isPaused: false, error: null, status: 'processing' }));
    expandAllSections(generationState.outline, generationController.current.currentIndex)
      .then(async (success) => {
        if (success && !generationController.current.shouldStop) {
          await runPostExpansionPipeline();
        }
      });
  }, [generationState.outline, expandAllSections, runPostExpansionPipeline]);
  
  const handleReset = useCallback(() => {
    generationController.current = { shouldStop: false, currentIndex: 0 };
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    chatRef.current = null;
    flashChatRef.current = null;
    
    const currentProject = projects.find(p => p.id === activeProjectId);
    if(currentProject) {
        setFormState(currentProject.formState);
    } else {
        setFormState(initialFormState);
    }
    setGenerationState(initialGenerationState);
    setCurrentView('input');
    setIsRateLimited(false);
    setRateLimitMessage('');
    setActiveProjectId(null); // Deselect project to start a new one
  }, [projects, activeProjectId]);

  const handleSaveApiKey = (newKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKey(newKey);
  };
  
  const handleCreateNewProject = () => {
    setActiveProjectId(null);
    setFormState(initialFormState);
    setGenerationState(initialGenerationState);
    setCurrentView('input');
    setAppView('generator');
  };

  const handleLoadProject = (projectId: string) => {
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
        setActiveProjectId(projectId);
        setFormState(projectToLoad.formState);
        setGenerationState(projectToLoad.generationState);
        setCurrentView(projectToLoad.generationState.currentView);
        setAppView('generator');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
        setProjects(prev => {
            const newProjects = prev.filter(p => p.id !== projectId);
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newProjects));
            return newProjects;
        });
        if (activeProjectId === projectId) {
            handleReset();
        }
    }
  };

  const handleUpdateProjectStatus = (projectId: string, status: ProjectStatus) => {
      setProjects(prev => {
          const newProjects = prev.map(p => p.id === projectId ? {...p, status} : p);
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newProjects));
          return newProjects;
      });
  };

  const handleNetworkStatusChange = useCallback(() => {
    if (!navigator.onLine) {
      if (generationState.status === 'processing' && !generationState.isPaused) {
        autoPausedByNetwork.current = true;
        handlePause();
        setGenerationState(prev => ({...prev, progressMessage: "Network connection lost. Paused."}));
      }
    } else {
      if (autoPausedByNetwork.current) {
        autoPausedByNetwork.current = false;
        handleResume();
         setGenerationState(prev => ({...prev, progressMessage: "Network reconnected. Resuming..."}));
      }
    }
  }, [generationState.status, generationState.isPaused, handlePause, handleResume]);

  useEffect(() => {
    window.addEventListener('online', handleNetworkStatusChange);
    window.addEventListener('offline', handleNetworkStatusChange);

    return () => {
      window.removeEventListener('online', handleNetworkStatusChange);
      window.removeEventListener('offline', handleNetworkStatusChange);
    };
  }, [handleNetworkStatusChange]);
  
  const renderGeneratorView = () => {
     const showStepper = generationState.status !== 'idle' || generationState.finalScript;
     return (
        <>
            {showStepper && (
              <Stepper
                currentView={generationState.currentView}
                setCurrentView={handleSetCurrentView}
                generationStatus={generationState.status}
                isPaused={!!generationState.isPaused}
                hasScript={!!generationState.finalScript}
                hasAudioChunks={generationState.audioChunks.length > 0}
                hasVeoPrompts={generationState.veoPrompts.length > 0}
                hasImagePrompts={generationState.imagePrompts.length > 0}
                hasGeneratedImages={generationState.hasGeneratedImages}
                hasSeo={!!generationState.seo}
              />
            )}
            
            {generationState.currentView === 'input' && (
              <InputForm
                formState={formState}
                setFormState={setFormState}
                onGenerate={handleFormSubmit}
                disabled={generationState.status === 'processing'}
              />
            )}
            
            {generationState.status === 'processing' && generationState.progressValue < 100 && (
              <ProgressBar
                message={generationState.progressMessage}
                value={generationState.progressValue}
                isPaused={!!generationState.isPaused}
                onPause={handlePause}
                onResume={handleResume}
                isRateLimited={isRateLimited}
                rateLimitMessage={rateLimitMessage}
              />
            )}
            
            {generationState.currentView === 'research' && generationState.researchText && (
                 <div className="bg-brand-bg p-4 sm:p-6 rounded-lg border border-brand-secondary/20 max-h-[60vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Research Summary</h3>
                    <div className="prose prose-invert text-brand-text whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: generationState.researchText.replace(/### STEP 1 — RESEARCH SUMMARY\n+/, '') }}></div>
                 </div>
            )}
            
            {generationState.currentView === 'outline' && generationState.outlineText && (
                 <div className="bg-brand-bg p-4 sm:p-6 rounded-lg border border-brand-secondary/20 max-h-[60vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-brand-primary mb-4">Generated Outline</h3>
                    <pre className="text-brand-text whitespace-pre-wrap font-serif text-base leading-relaxed">{generationState.outlineText}</pre>
                 </div>
            )}
            
            {generationState.currentView === 'script' && (
                <ScriptDisplay
                    state={generationState}
                    formState={formState}
                    onReset={handleReset}
                    onResume={handleResume}
                    onViewAudioChunks={() => handleSetCurrentView('audioChunks')}
                    onGenerateVeoPrompts={() => setIsVeoModalOpen(true)}
                    onViewVeoPrompts={() => handleSetCurrentView('veoPrompts')}
                    onGenerateImagePrompts={() => setIsImageModalOpen(true)}
                    onViewImagePrompts={() => handleSetCurrentView('imagePrompts')}
                    onViewImageGeneration={() => {
                        setAppView('imageGenerator');
                    }}
                    onGenerateSeo={() => handleGenerateSeo()}
                    onViewSeo={() => handleSetCurrentView('seo')}
                    onGenerateThumbnails={() => setIsThumbnailModalOpen(true)}
                    onViewThumbnails={() => {
                        setIsThumbnailModalOpen(true)
                    }}
                />
            )}
            
            {generationState.currentView === 'audioChunks' && (
                <AudioChunksDisplay chunks={generationState.audioChunks} onBack={() => handleSetCurrentView('script')} />
            )}

            {generationState.currentView === 'veoPrompts' && (
                <VeoPromptsDisplay
                    formState={formState}
                    prompts={generationState.veoPrompts}
                    status={veoGenerationStatus}
                    error={generationState.error}
                    onReset={() => handleSetCurrentView('script')}
                    onRegenerate={handleRegenerateVeoPrompts}
                />
            )}

             {generationState.currentView === 'imagePrompts' && (
                <ImagePromptsDisplay
                    prompts={generationState.imagePrompts}
                    status={imageGenerationStatus}
                    error={generationState.error}
                    onReset={() => handleSetCurrentView('script')}
                    onRegenerate={handleRegenerateImagePrompts}
                />
            )}

            {generationState.currentView === 'seo' && (
                <SeoDisplay
                    seo={generationState.seo}
                    status={seoGenerationStatus}
                    error={generationState.error}
                    onReset={() => handleSetCurrentView('script')}
                />
            )}
        </>
     )
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto">
        <AppHeader appView={appView} setAppView={setAppView} onOpenSettings={() => setIsApiKeyModalOpen(true)} />
        
        {appView === 'generator' && (
          <main className="bg-brand-surface p-4 sm:p-8 rounded-xl shadow-2xl border border-brand-secondary/10">
            {renderGeneratorView()}
          </main>
        )}
        
        {appView === 'contentSuite' && (
           <main className="bg-brand-surface p-4 sm:p-8 rounded-xl shadow-2xl border border-brand-secondary/10">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-brand-primary">Project Library</h2>
                   <button 
                       onClick={handleCreateNewProject}
                       className="bg-brand-accent text-brand-bg font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-yellow-500 transition-all"
                   >
                       + New Script
                   </button>
               </div>
               <ContentSuiteView
                    projects={projects}
                    onView={handleLoadProject}
                    onDelete={handleDeleteProject}
                    onUpdateStatus={handleUpdateProjectStatus}
                />
           </main>
        )}

        {appView === 'imageGenerator' && (
             <main className="bg-brand-surface p-4 sm:p-8 rounded-xl shadow-2xl border border-brand-secondary/10 w-full max-w-7xl -mx-auto">
                <ImageGeneratorView 
                    ai={ai} 
                    initialPromptsText={generationState.imageGeneratorPrompts} 
                    autoStart={activeProjectId !== null} // Auto-start if it's part of a project
                    onGenerationComplete={() => setGenerationState(prev => ({...prev, hasGeneratedImages: true}))}
                    initialImageResults={generationState.generatedImages}
                    onImageResultsChange={handleUpdateImageResults}
                />
             </main>
        )}

        <SectionSelectionModal
            isOpen={isVeoModalOpen}
            onClose={() => setIsVeoModalOpen(false)}
            sections={generationState.outline}
            onGenerate={(selected) => handleGenerateVeoPrompts(selected, generationState.generatedSections)}
            title="Select sections for Veo prompts"
        />

        <SectionSelectionModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            sections={generationState.outline}
            onGenerate={(selected) => handleGenerateImagePrompts(selected, generationState.generatedSections)}
            title="Select sections for Image prompts"
        />

        <ThumbnailModal
            isOpen={isThumbnailModalOpen}
            onClose={() => setIsThumbnailModalOpen(false)}
            title={formState.title}
            initialHeadings={generationState.outline.slice(0, 3).map(s => s.title)}
            generatedPrompts={generationState.thumbnailPrompts}
            status={thumbnailGenerationStatus}
            onGenerate={handleGenerateThumbnails}
            error={generationState.error}
        />
        
        <ApiKeyModal 
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={handleSaveApiKey}
          currentApiKey={apiKey}
        />

      </div>
       <footer className="text-center mt-8 text-brand-secondary text-sm">
            <p>Built with Gemini. For entertainment and relaxation purposes only.</p>
        </footer>
    </div>
  );
};

export default App;
