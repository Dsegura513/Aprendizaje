import { useEditorStore } from '../store/useEditorStore';

interface TopBarProps {
  onImportClick: () => void;
}

export function TopBar({ onImportClick }: TopBarProps) {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const snapping = useEditorStore((state) => state.snapping);
  const togglePlayback = useEditorStore((state) => state.togglePlayback);
  const splitAtPlayhead = useEditorStore((state) => state.splitAtPlayhead);
  const deleteSelectedClip = useEditorStore((state) => state.deleteSelectedClip);
  const toggleSnapping = useEditorStore((state) => state.toggleSnapping);

  return (
    <header className="topbar panel">
      <div>
        <h1>Aprendizaje Studio Pro</h1>
        <p>Editor multipista con flujo de trabajo moderno (biblioteca + preview + timeline + propiedades).</p>
      </div>

      <div className="topbar-actions">
        <button onClick={onImportClick}>+ Importar medios</button>
        <button onClick={togglePlayback}>{isPlaying ? '⏸ Pausar' : '▶ Reproducir'}</button>
        <button onClick={splitAtPlayhead}>✂ Split (Ctrl/Cmd + B)</button>
        <button onClick={toggleSnapping}>{snapping ? '🧲 Snap ON' : '🧲 Snap OFF'}</button>
        <button className="danger" onClick={deleteSelectedClip}>🗑 Eliminar clip</button>
      </div>
    </header>
  );
}
