import { useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { Clip } from '../types/editor';

const findActiveClip = (clips: Clip[], playheadTime: number) =>
  clips.find((clip) => playheadTime >= clip.start && playheadTime <= clip.start + clip.duration) ?? null;

export function PreviewPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = useEditorStore((state) => state.tracks);
  const assets = useEditorStore((state) => state.assets);
  const playheadTime = useEditorStore((state) => state.playheadTime);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const setPlayheadTime = useEditorStore((state) => state.setPlayheadTime);

  const videoClips = useMemo(
    () => tracks.filter((track) => track.type === 'video').flatMap((track) => track.clips),
    [tracks]
  );

  const audioClips = useMemo(
    () => tracks.filter((track) => track.type === 'audio').flatMap((track) => track.clips),
    [tracks]
  );

  const activeVisual = findActiveClip(videoClips, playheadTime);
  const activeAudio = findActiveClip(audioClips, playheadTime);

  const activeVisualAsset = activeVisual ? assets.find((asset) => asset.id === activeVisual.assetId) : null;
  const activeAudioAsset = activeAudio ? assets.find((asset) => asset.id === activeAudio.assetId) : null;

  useEffect(() => {
    if (isPlaying) {
      const timer = window.setInterval(() => {
        setPlayheadTime(useEditorStore.getState().playheadTime + 1 / 30);
      }, 33);
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [isPlaying, setPlayheadTime]);

  useEffect(() => {
    if (!activeVisual || !activeVisualAsset || !videoRef.current || activeVisual.mediaType === 'text') return;
    if (activeVisual.mediaType === 'image') return;

    if (videoRef.current.src !== activeVisualAsset.url) {
      videoRef.current.src = activeVisualAsset.url;
    }

    videoRef.current.currentTime = Math.max(0, activeVisual.sourceStart + (playheadTime - activeVisual.start));
    videoRef.current.playbackRate = activeVisual.speed;
    videoRef.current.volume = activeVisual.volume;

    if (isPlaying) {
      void videoRef.current.play().catch(() => undefined);
    } else {
      videoRef.current.pause();
    }
  }, [activeVisual, activeVisualAsset, playheadTime, isPlaying]);

  useEffect(() => {
    if (!activeAudio || !activeAudioAsset || !audioRef.current) return;

    if (audioRef.current.src !== activeAudioAsset.url) {
      audioRef.current.src = activeAudioAsset.url;
    }

    audioRef.current.currentTime = Math.max(0, activeAudio.sourceStart + (playheadTime - activeAudio.start));
    audioRef.current.playbackRate = activeAudio.speed;
    audioRef.current.volume = activeAudio.volume;

    if (isPlaying) {
      void audioRef.current.play().catch(() => undefined);
    } else {
      audioRef.current.pause();
    }
  }, [activeAudio, activeAudioAsset, playheadTime, isPlaying]);

  const renderVisual = () => {
    if (!activeVisual || !activeVisualAsset) {
      return <div className="empty-preview">Sin clip activo. Arrastra medios a una pista de video.</div>;
    }

    if (activeVisual.mediaType === 'image') {
      return <img src={activeVisualAsset.url} alt={activeVisual.name} className="preview-image" />;
    }

    if (activeVisual.mediaType === 'text') {
      return <div className="text-card">{activeVisual.text || 'Texto vacío'}</div>;
    }

    return <video ref={videoRef} playsInline muted={false} />;
  };

  const overlayTextClip = videoClips.find(
    (clip) => clip.mediaType === 'text' && playheadTime >= clip.start && playheadTime <= clip.start + clip.duration
  );

  return (
    <section className="panel preview-panel">
      <div className="panel-title-row">
        <h2>Preview</h2>
        <span>{playheadTime.toFixed(2)}s</span>
      </div>

      <div className="preview-screen">
        {renderVisual()}
        {overlayTextClip?.text && <div className="preview-text-overlay">{overlayTextClip.text}</div>}
      </div>

      <audio ref={audioRef} hidden />
    </section>
  );
}
