
export type ImageStatus = 'pending' | 'generating' | 'success' | 'error';

export interface ImageResult {
  status: ImageStatus;
  data?: string; // base64 data URL
  error?: string;
}

export interface FormState {
  title: string;
  context: string;
  durationMin: number;
  wpm: number;
}

export interface OutlineSection {
  index: number;
  title: string;
  targetWords: number;
}

export interface GeneratedSection {
  index: number;
  title: string;
  body: string;
  wordCount: number;
  targetWords: number;
}

export interface VeoPrompt {
  id: number;
  scene: string;
  text: string;
  prompt: string;
}

export interface ImagePrompt {
  id: number;
  scene: string;
  text: string;
  prompt: string;
}

export interface SeoResult {
  titles: string[];
  description: string;
}

export interface ThumbnailPrompt {
  label: string;
  prompt: string;
}

export type GenerationStatus = 'idle' | 'processing' | 'complete' | 'error';
export type View = 'input' | 'research' | 'outline' | 'script' | 'audioChunks' | 'veoPrompts' | 'seo' | 'imagePrompts' | 'imageGeneration';

export interface GenerationState {
  status: GenerationStatus;
  currentView: View;
  progressMessage: string;
  progressValue: number;
  outline: OutlineSection[];
  researchText: string;
  outlineText: string;
  generatedSections: Record<number, GeneratedSection>;
  finalScript: string;
  finalScriptNoHeadings: string;
  audioChunks: string[];
  veoPrompts: VeoPrompt[];
  veoPromptSections: number[];
  imagePrompts: ImagePrompt[];
  imagePromptSections: number[];
  seo: SeoResult | null;
  thumbnailPrompts: ThumbnailPrompt[] | null;
  error: string | null;
  isPaused?: boolean;
  imageGeneratorPrompts: string;
  hasGeneratedImages: boolean;
  generatedImages: Record<number, ImageResult>;
}

export type ProjectStatus = 'working' | 'paused' | 'completed' | 'uploaded' | 'failed';

export interface ScriptProject {
  id: string;
  formState: FormState;
  generationState: GenerationState;
  createdAt: string;
  status: ProjectStatus;
}

export type AppView = 'generator' | 'contentSuite' | 'imageGenerator';
