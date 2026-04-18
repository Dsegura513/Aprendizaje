import { ChangeEvent, useEffect, useRef } from 'react';
import { MediaLibrary } from './components/MediaLibrary';
import { PreviewPanel } from './components/PreviewPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import { TopBar } from './components/TopBar';
import { useEditorStore } from './store/useEditorStore';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addAssets = useEditorStore((state) => state.addAssets);
  const togglePlayback = useEditorStore((state) => state.togglePlayback);
  const splitAtPlayhead = useEditorStore((state) => state.splitAtPlayhead);
  const deleteSelectedClip = useEditorStore((state) => state.deleteSelectedClip);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag && ['input', 'textarea', 'select'].includes(activeTag)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        splitAtPlayhead();
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelectedClip();
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [togglePlayback, splitAtPlayhead, deleteSelectedClip]);

  const onFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    await addAssets(files);
    event.currentTarget.value = '';
  };

  return (
    <div className="app-shell">
      <TopBar onImportClick={() => fileInputRef.current?.click()} />

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept="video/*,audio/*,image/*"
        onChange={onFilesChange}
      />

      <section className="workspace-grid">
        <MediaLibrary onDropFiles={addAssets} />
        <PreviewPanel />
        <PropertiesPanel />
      </section>

      <Timeline onDropFiles={addAssets} />
    </div>
  );
}
