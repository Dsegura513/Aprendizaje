import { DragEvent, MouseEvent, useMemo, useState } from 'react';
import { getTimelineDuration, useEditorStore } from '../store/useEditorStore';
import { DragPayload } from '../types/editor';

interface TimelineProps {
  onDropFiles: (files: FileList) => void;
}

const parsePayload = (event: DragEvent<HTMLElement>): DragPayload | null => {
  const raw = event.dataTransfer.getData('application/editor-dnd');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
};

export function Timeline({ onDropFiles }: TimelineProps) {
  const tracks = useEditorStore((state) => state.tracks);
  const addClipFromAsset = useEditorStore((state) => state.addClipFromAsset);
  const moveClip = useEditorStore((state) => state.moveClip);
  const resizeClip = useEditorStore((state) => state.resizeClip);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const setSelectedClip = useEditorStore((state) => state.setSelectedClip);
  const playheadTime = useEditorStore((state) => state.playheadTime);
  const setPlayheadTime = useEditorStore((state) => state.setPlayheadTime);
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);

  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const timelineDuration = useMemo(() => getTimelineDuration(tracks), [tracks]);
  const timelineWidth = timelineDuration * zoom;

  const timeFromMouse = (event: DragEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollLeft = 'scrollLeft' in event.currentTarget ? event.currentTarget.scrollLeft : 0;
    return Math.max(0, (event.clientX - rect.left + scrollLeft) / zoom);
  };

  const onTrackDrop = (event: DragEvent<HTMLDivElement>, trackId: string) => {
    event.preventDefault();

    const payload = parsePayload(event);
    const dropTime = timeFromMouse(event);

    if (payload?.kind === 'asset') {
      addClipFromAsset(payload.id, trackId, dropTime);
      return;
    }

    if (payload?.kind === 'clip') {
      moveClip(payload.id, trackId, dropTime);
      setDraggingClipId(null);
      return;
    }

    if (event.dataTransfer.files?.length) {
      onDropFiles(event.dataTransfer.files);
    }
  };

  const dragClip = (event: DragEvent<HTMLDivElement>, clipId: string) => {
    const payload: DragPayload = { kind: 'clip', id: clipId };
    event.dataTransfer.setData('application/editor-dnd', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
    setDraggingClipId(clipId);
  };

  const startResize = (
    event: MouseEvent<HTMLDivElement>,
    clipId: string,
    direction: 'left' | 'right'
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const origin = event.clientX;

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaSeconds = (moveEvent.clientX - origin) / zoom;
      resizeClip(clipId, direction, deltaSeconds);
    };

    const onStop = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onStop);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onStop);
  };

  return (
    <section className="panel timeline-panel">
      <div className="panel-title-row">
        <h2>Timeline multipista</h2>
        <div className="timeline-controls">
          <label>Zoom</label>
          <input
            type="range"
            min={30}
            max={260}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="timeline-shell">
        <div
          className="timeline-ruler"
          style={{ width: timelineWidth }}
          onClick={(event) => setPlayheadTime(timeFromMouse(event))}
        >
          {Array.from({ length: Math.ceil(timelineDuration) + 1 }).map((_, second) => (
            <div key={second} className="tick" style={{ left: second * zoom }}>
              <span>{second}s</span>
            </div>
          ))}
          <div className="playhead" style={{ left: playheadTime * zoom }} />
        </div>

        {tracks.map((track) => (
          <div
            className={`track ${track.type}`}
            key={track.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onTrackDrop(event, track.id)}
          >
            <div className="track-label">{track.name}</div>
            <div className="track-clips" style={{ width: timelineWidth }}>
              {track.clips.map((clip) => (
                <div
                  key={clip.id}
                  className={`clip ${selectedClipId === clip.id ? 'selected' : ''} ${draggingClipId === clip.id ? 'dragging' : ''}`}
                  style={{ left: clip.start * zoom, width: Math.max(clip.duration * zoom, 16) }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedClip(clip.id);
                  }}
                  draggable
                  onDragStart={(event) => dragClip(event, clip.id)}
                  onDragEnd={() => setDraggingClipId(null)}
                >
                  <div className="resize-handle left" onMouseDown={(event) => startResize(event, clip.id, 'left')} />
                  <span>{clip.name}</span>
                  <small>{clip.duration.toFixed(2)}s</small>
                  <div className="resize-handle right" onMouseDown={(event) => startResize(event, clip.id, 'right')} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="hint">
        Soporte completo: drag & drop, split, trim con asas, move entre pistas, zoom, playhead y snapping.
      </p>
    </section>
  );
}
