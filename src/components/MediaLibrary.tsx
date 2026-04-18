import { DragEvent } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { DragPayload, MediaType } from '../types/editor';

interface MediaLibraryProps {
  onDropFiles: (files: FileList) => void;
}

const typeLabel: Record<MediaType, string> = {
  video: '🎬 Video',
  audio: '🎵 Audio',
  image: '🖼 Imagen',
  text: '🔤 Texto'
};

export function MediaLibrary({ onDropFiles }: MediaLibraryProps) {
  const assets = useEditorStore((state) => state.assets);
  const addTextAsset = useEditorStore((state) => state.addTextAsset);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files?.length) {
      onDropFiles(event.dataTransfer.files);
    }
  };

  const dragAsset = (event: DragEvent<HTMLDivElement>, assetId: string) => {
    const payload: DragPayload = { kind: 'asset', id: assetId };
    event.dataTransfer.setData('application/editor-dnd', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const counts = {
    video: assets.filter((asset) => asset.type === 'video').length,
    audio: assets.filter((asset) => asset.type === 'audio').length,
    image: assets.filter((asset) => asset.type === 'image').length,
    text: assets.filter((asset) => asset.type === 'text').length
  };

  return (
    <aside className="panel media-library" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <div className="panel-title-row">
        <h2>Biblioteca de medios</h2>
        <span>{assets.length} assets</span>
      </div>

      <div className="stats-row">
        <span>🎬 {counts.video}</span>
        <span>🎵 {counts.audio}</span>
        <span>🖼 {counts.image}</span>
        <span>🔤 {counts.text}</span>
      </div>

      <button className="ghost" onClick={addTextAsset}>+ Añadir capa de texto</button>
      <p className="hint">Arrastra cualquier asset a la timeline o suelta archivos aquí para importarlos.</p>

      <div className="asset-list">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="asset-card"
            draggable
            onDragStart={(event) => dragAsset(event, asset.id)}
            title="Arrastra a la timeline"
          >
            <strong>{asset.name}</strong>
            <small>{typeLabel[asset.type]}</small>
            <small>{asset.duration.toFixed(2)}s</small>
          </div>
        ))}
      </div>
    </aside>
  );
}
