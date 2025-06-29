import type { ParsedDeck } from './cards';

export interface FileUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

export interface UploadState {
  uploading: boolean;
  progress: number;
  currentFile: string | null;
  error: string | null;
}

export interface UploadResult {
  success: boolean;
  cardsProcessed: number;
  errors: string[];
  deck: ParsedDeck;
  contributorName: string;
  deckName?: string;
}

export interface ContributorInfo {
  name: string;
  required: boolean;
  placeholder: string;
}

export interface DeckUpload {
  filename: string;
  contributor: string;
  uploadTime: string;
  cardCount: number;
  errors: string[];
}