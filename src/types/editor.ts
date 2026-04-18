export type MediaType = 'video' | 'audio' | 'image' | 'text';
export type TrackType = 'video' | 'audio';

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  duration: number;
  file?: File;
}

export interface ClipTransition {
  type: 'none' | 'fade' | 'slide';
  duration: number;
}

export interface Clip {
  id: string;
  trackId: string;
  assetId: string;
  mediaType: MediaType;
  name: string;
  start: number;
  duration: number;
  sourceStart: number;
  sourceDuration: number;
  volume: number;
  speed: number;
  text: string;
  transitionIn: ClipTransition;
  transitionOut: ClipTransition;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
}

export interface DragPayload {
  kind: 'asset' | 'clip';
  id: string;
}

export interface EditorState {
  assets: MediaAsset[];
  tracks: Track[];
  selectedClipId: string | null;
  playheadTime: number;
  zoom: number;
  isPlaying: boolean;
  snapping: boolean;

  addAssets: (files: FileList | File[]) => Promise<void>;
  addTextAsset: () => void;
  addClipFromAsset: (assetId: string, trackId: string, atTime?: number) => void;
  moveClip: (clipId: string, nextTrackId: string, nextStart: number) => void;
  resizeClip: (clipId: string, direction: 'left' | 'right', deltaSeconds: number) => void;
  splitAtPlayhead: () => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  deleteSelectedClip: () => void;

  setSelectedClip: (clipId: string | null) => void;
  setPlayheadTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  togglePlayback: () => void;
  toggleSnapping: () => void;
}
