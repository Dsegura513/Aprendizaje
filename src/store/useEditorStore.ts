import { create } from 'zustand';
import { Clip, EditorState, MediaAsset, MediaType, Track } from '../types/editor';

const DEFAULT_SNAP = 0.1;

const makeId = () => crypto.randomUUID();
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const detectMediaType = (file: File): MediaType => {
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  return 'video';
};

const detectMediaDuration = (file: File, type: MediaType): Promise<number> => {
  if (type === 'image' || type === 'text') {
    return Promise.resolve(5);
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const node = document.createElement(type === 'audio' ? 'audio' : 'video');
    node.preload = 'metadata';
    node.src = url;

    node.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(node.duration) && node.duration > 0 ? node.duration : 5);
    };

    node.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(5);
    };
  });
};

const initialTracks: Track[] = [
  { id: 'video-track-1', type: 'video', name: 'Video 1', clips: [] },
  { id: 'video-track-2', type: 'video', name: 'Video 2', clips: [] },
  { id: 'audio-track-1', type: 'audio', name: 'Audio 1', clips: [] },
  { id: 'audio-track-2', type: 'audio', name: 'Audio 2', clips: [] }
];

const getTrackById = (tracks: Track[], trackId: string) => tracks.find((track) => track.id === trackId);

const findClipWithTrack = (tracks: Track[], clipId: string) => {
  for (const track of tracks) {
    const index = track.clips.findIndex((clip) => clip.id === clipId);
    if (index >= 0) {
      return { track, index, clip: track.clips[index] };
    }
  }
  return null;
};

const snapTime = (time: number, enabled: boolean) => (enabled ? Math.round(time / DEFAULT_SNAP) * DEFAULT_SNAP : time);

export const useEditorStore = create<EditorState>((set, get) => ({
  assets: [],
  tracks: initialTracks,
  selectedClipId: null,
  playheadTime: 0,
  zoom: 90,
  isPlaying: false,
  snapping: true,

  addAssets: async (files) => {
    const list = Array.from(files);

    const nextAssets: MediaAsset[] = await Promise.all(
      list.map(async (file) => {
        const type = detectMediaType(file);
        const duration = await detectMediaDuration(file, type);

        return {
          id: makeId(),
          file,
          type,
          duration,
          name: file.name,
          url: URL.createObjectURL(file)
        };
      })
    );

    set((state) => ({
      assets: [...state.assets, ...nextAssets]
    }));
  },

  addTextAsset: () => {
    set((state) => ({
      assets: [
        ...state.assets,
        {
          id: makeId(),
          type: 'text',
          name: `Texto ${state.assets.filter((asset) => asset.type === 'text').length + 1}`,
          duration: 4,
          url: ''
        }
      ]
    }));
  },

  addClipFromAsset: (assetId, trackId, atTime) => {
    set((state) => {
      const asset = state.assets.find((item) => item.id === assetId);
      const track = getTrackById(state.tracks, trackId);
      if (!asset || !track) return state;

      const lastTime = track.clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
      const desiredStart = snapTime(atTime ?? lastTime, state.snapping);

      const clip: Clip = {
        id: makeId(),
        trackId,
        assetId,
        mediaType: asset.type,
        name: asset.name,
        start: Math.max(0, desiredStart),
        duration: asset.duration,
        sourceStart: 0,
        sourceDuration: asset.duration,
        volume: asset.type === 'video' || asset.type === 'audio' ? 1 : 0,
        speed: 1,
        text: asset.type === 'text' ? 'Nuevo texto' : '',
        transitionIn: { type: 'none', duration: 0 },
        transitionOut: { type: 'none', duration: 0 }
      };

      return {
        ...state,
        tracks: state.tracks.map((item) =>
          item.id === trackId
            ? { ...item, clips: [...item.clips, clip].sort((a, b) => a.start - b.start) }
            : item
        ),
        selectedClipId: clip.id
      };
    });
  },

  moveClip: (clipId, nextTrackId, nextStart) => {
    set((state) => {
      const found = findClipWithTrack(state.tracks, clipId);
      if (!found) return state;

      const snappedStart = snapTime(Math.max(0, nextStart), state.snapping);
      const movedClip: Clip = {
        ...found.clip,
        start: snappedStart,
        trackId: nextTrackId
      };

      return {
        ...state,
        tracks: state.tracks.map((track) => {
          if (track.id === found.track.id) {
            return { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) };
          }

          if (track.id === nextTrackId) {
            return {
              ...track,
              clips: [...track.clips, movedClip].sort((a, b) => a.start - b.start)
            };
          }

          return track;
        })
      };
    });
  },

  resizeClip: (clipId, direction, deltaSeconds) => {
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;

          if (direction === 'right') {
            const nextDuration = clamp(
              snapTime(clip.duration + deltaSeconds, state.snapping),
              0.2,
              clip.sourceDuration
            );
            return { ...clip, duration: nextDuration };
          }

          const initialEnd = clip.start + clip.duration;
          const nextStart = clamp(
            snapTime(clip.start + deltaSeconds, state.snapping),
            0,
            initialEnd - 0.2
          );

          return {
            ...clip,
            start: nextStart,
            duration: clamp(initialEnd - nextStart, 0.2, clip.sourceDuration),
            sourceStart: clamp(clip.sourceStart + (nextStart - clip.start), 0, clip.sourceDuration)
          };
        })
      }))
    }));
  },

  splitAtPlayhead: () => {
    const { selectedClipId, playheadTime, tracks } = get();
    if (!selectedClipId) return;

    const found = findClipWithTrack(tracks, selectedClipId);
    if (!found) return;

    const localTime = playheadTime - found.clip.start;
    if (localTime <= 0.15 || localTime >= found.clip.duration - 0.15) return;

    const leftClip: Clip = {
      ...found.clip,
      id: makeId(),
      duration: localTime,
      transitionOut: { type: 'none', duration: 0 }
    };

    const rightClip: Clip = {
      ...found.clip,
      id: makeId(),
      start: found.clip.start + localTime,
      sourceStart: found.clip.sourceStart + localTime,
      duration: found.clip.duration - localTime,
      transitionIn: { type: 'none', duration: 0 }
    };

    set({
      tracks: tracks.map((track) => {
        if (track.id !== found.track.id) return track;

        const clips = [...track.clips];
        clips.splice(found.index, 1, leftClip, rightClip);
        return { ...track, clips };
      }),
      selectedClipId: rightClip.id
    });
  },

  updateClip: (clipId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          return {
            ...clip,
            ...updates,
            volume: updates.volume !== undefined ? clamp(updates.volume, 0, 2) : clip.volume,
            speed: updates.speed !== undefined ? clamp(updates.speed, 0.25, 4) : clip.speed,
            duration: updates.duration !== undefined ? Math.max(0.2, updates.duration) : clip.duration,
            sourceStart: updates.sourceStart !== undefined ? Math.max(0, updates.sourceStart) : clip.sourceStart
          };
        })
      }))
    }));
  },

  deleteSelectedClip: () => {
    const selected = get().selectedClipId;
    if (!selected) return;

    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.id !== selected)
      })),
      selectedClipId: null
    }));
  },

  setSelectedClip: (clipId) => set({ selectedClipId: clipId }),
  setPlayheadTime: (time) => set({ playheadTime: Math.max(0, time) }),
  setZoom: (zoom) => set({ zoom: clamp(zoom, 30, 260) }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleSnapping: () => set((state) => ({ snapping: !state.snapping }))
}));

export const getTimelineDuration = (tracks: Track[]) =>
  tracks.flatMap((track) => track.clips).reduce((max, clip) => Math.max(max, clip.start + clip.duration + 1), 20);

export const findSelectedClip = (tracks: Track[], selectedClipId: string | null) => {
  if (!selectedClipId) return null;
  return tracks.flatMap((track) => track.clips).find((clip) => clip.id === selectedClipId) ?? null;
};
