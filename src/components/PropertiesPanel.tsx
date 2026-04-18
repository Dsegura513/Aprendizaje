import { ChangeEvent } from 'react';
import { findSelectedClip, useEditorStore } from '../store/useEditorStore';

export function PropertiesPanel() {
  const tracks = useEditorStore((state) => state.tracks);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const updateClip = useEditorStore((state) => state.updateClip);

  const selectedClip = findSelectedClip(tracks, selectedClipId);

  const onNumber = (key: 'duration' | 'sourceStart' | 'volume' | 'speed') => (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, { [key]: Number(event.target.value) });
  };

  const onTransition = (side: 'transitionIn' | 'transitionOut', field: 'type' | 'duration') =>
    (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      if (!selectedClip) return;
      const current = selectedClip[side];
      updateClip(selectedClip.id, {
        [side]: {
          ...current,
          [field]: field === 'duration' ? Number(event.target.value) : event.target.value
        }
      });
    };

  if (!selectedClip) {
    return (
      <aside className="panel properties-panel">
        <h2>Propiedades</h2>
        <p className="hint">Selecciona un clip para editar trim, velocidad, volumen, transiciones y texto.</p>
      </aside>
    );
  }

  return (
    <aside className="panel properties-panel">
      <h2>Propiedades del clip</h2>

      <div className="property-group">
        <label>Nombre</label>
        <strong>{selectedClip.name}</strong>
      </div>

      <div className="property-group">
        <label>Trim inicio (sourceStart)</label>
        <input type="number" value={selectedClip.sourceStart.toFixed(2)} min={0} step={0.05} onChange={onNumber('sourceStart')} />
      </div>

      <div className="property-group">
        <label>Duración</label>
        <input type="number" value={selectedClip.duration.toFixed(2)} min={0.2} step={0.05} onChange={onNumber('duration')} />
      </div>

      <div className="property-group">
        <label>Volumen</label>
        <input type="range" value={selectedClip.volume} min={0} max={2} step={0.05} onChange={onNumber('volume')} />
      </div>

      <div className="property-group">
        <label>Velocidad</label>
        <input type="range" value={selectedClip.speed} min={0.25} max={4} step={0.05} onChange={onNumber('speed')} />
      </div>

      <div className="property-group">
        <label>Texto overlay</label>
        <input
          type="text"
          value={selectedClip.text}
          placeholder="Introduce texto"
          onChange={(event) => updateClip(selectedClip.id, { text: event.target.value })}
        />
      </div>

      <div className="property-group two-cols">
        <label>Transición entrada</label>
        <select value={selectedClip.transitionIn.type} onChange={onTransition('transitionIn', 'type')}>
          <option value="none">None</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
        </select>
        <input type="number" min={0} max={2} step={0.1} value={selectedClip.transitionIn.duration} onChange={onTransition('transitionIn', 'duration')} />
      </div>

      <div className="property-group two-cols">
        <label>Transición salida</label>
        <select value={selectedClip.transitionOut.type} onChange={onTransition('transitionOut', 'type')}>
          <option value="none">None</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
        </select>
        <input type="number" min={0} max={2} step={0.1} value={selectedClip.transitionOut.duration} onChange={onTransition('transitionOut', 'duration')} />
      </div>
    </aside>
  );
}
