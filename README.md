# Aprendizaje Studio Pro (Base sólida para editor SaaS)

Este proyecto fue reestructurado para dejar de ser un prototipo básico y convertirse en una base real de editor web moderno (estilo Clipchamp/CapCut).

## 1) Qué se corrigió respecto a los problemas reportados

### Carga de archivos
- ✅ Soporte **real** de carga múltiple con `multiple` (`video/*`, `audio/*`, `image/*`).
- ✅ Biblioteca de medios con conteo por tipo.
- ✅ Gestión de assets en estado global (`assets[]`).
- ✅ Drag & drop desde biblioteca a timeline.

### Timeline
- ✅ Timeline **multipista** (2 pistas de video + 2 pistas de audio).
- ✅ Múltiples clips por pista.
- ✅ Move entre pistas con drag & drop.
- ✅ Zoom y playhead funcional.

### Edición
- ✅ Split preciso en playhead (`Ctrl/Cmd + B`).
- ✅ Trim visual con asas izquierda/derecha.
- ✅ Control de volumen y velocidad por clip.
- ✅ Texto sobre video (clip tipo texto + propiedad de texto).
- ✅ Transiciones básicas (modelo y edición en panel de propiedades).

### UX/UI
- ✅ Layout profesional:
  - Izquierda: biblioteca
  - Centro: preview
  - Derecha: propiedades
  - Abajo: timeline
- ✅ Feedback visual de selección, dragging, hover y snapping.

---

## 2) Arquitectura

### Stack
- React + TypeScript
- Zustand (estado centralizado)
- Vite

### Dominio tipado
- `MediaAsset`: medio importado.
- `Track`: pista de timeline (`video` | `audio`).
- `Clip`: instancia editable de un asset (start/duration/sourceStart/volume/speed/transiciones/texto).

### Estado único (store)
Archivo: `src/store/useEditorStore.ts`

Acciones principales:
- `addAssets(files)`
- `addTextAsset()`
- `addClipFromAsset(assetId, trackId, atTime)`
- `moveClip(clipId, nextTrackId, nextStart)`
- `resizeClip(clipId, direction, deltaSeconds)`
- `splitAtPlayhead()`
- `updateClip(clipId, updates)`
- `setPlayheadTime(time)` / `setZoom(zoom)` / `togglePlayback()`

---

## 3) Estructura de componentes

```text
src/
  App.tsx                      # Wiring global + shortcuts
  types/editor.ts              # Tipos de dominio
  store/useEditorStore.ts      # Estado + lógica de edición
  components/
    TopBar.tsx                 # Acciones globales (import/play/split/snap/delete)
    MediaLibrary.tsx           # Biblioteca + drag source
    PreviewPanel.tsx           # Preview sincronizada con playhead
    Timeline.tsx               # Timeline multipista + DnD + trim + playhead + zoom
    PropertiesPanel.tsx        # Inspector del clip seleccionado
  styles.css                   # UI moderna y layout profesional
```

---

## 4) Implementaciones clave

### A) Upload múltiple real

```tsx
<input
  type="file"
  multiple
  accept="video/*,audio/*,image/*"
  onChange={onFilesChange}
/>
```

### B) Drag & drop hacia timeline

```ts
const payload = { kind: 'asset', id: assetId };
event.dataTransfer.setData('application/editor-dnd', JSON.stringify(payload));

const dropTime = (event.clientX - rect.left + scrollLeft) / zoom;
addClipFromAsset(payload.id, trackId, dropTime);
```

### C) Split de clip en playhead

```ts
const localTime = playheadTime - clip.start;
const leftClip = { ...clip, duration: localTime };
const rightClip = {
  ...clip,
  start: clip.start + localTime,
  sourceStart: clip.sourceStart + localTime,
  duration: clip.duration - localTime
};
```

### D) Trim visual con asas

```ts
const deltaSeconds = (mouseX - originX) / zoom;
resizeClip(clipId, 'left' | 'right', deltaSeconds);
```

---

## 5) Decisiones de diseño (por qué)

- **Zustand**: permite separar UI de lógica de edición sin el boilerplate de Redux.
- **Clips como instancias de assets**: habilita reutilizar un mismo medio múltiples veces en timeline.
- **Snapping opcional**: mejora precisión para cortes y movimientos.
- **Panel de propiedades dedicado**: edición contextual, más rápida y clara.
- **Timeline en tracks**: base necesaria para capas, compositing y audio futuro.

---

## 6) Roadmap siguiente (nivel producción SaaS)

1. Render/export con WebCodecs + FFmpeg WASM en Web Worker.
2. Mixer de audio multipista real (no un único clip activo).
3. Undo/redo con historial de comandos.
4. Keyframes (volumen, opacidad, posición, velocidad).
5. Waveform de audio y marcadores.
6. Guardado de proyecto en backend + colaboración.

---

## 7) Ejecución

```bash
npm install
npm run dev
npm run build
```
