# Aprendizaje Studio

Editor de video web (cliente) con funciones clave de editores populares:

- Importación de video local.
- Reproducción con controles de transporte y línea de tiempo.
- Recorte por punto de entrada/salida.
- Ajustes de volumen y velocidad.
- Filtros en tiempo real (brillo, contraste, saturación, sepia, escala de grises).
- Texto superpuesto configurable (contenido, tamaño, color y posición).
- Exportación del clip editado a WebM desde el navegador.

## Ejecutar

Como es una app estática, puedes abrir `index.html` directamente o iniciar un servidor local:

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Notas

- La exportación usa `MediaRecorder` y `canvas.captureStream`, por lo que el formato de salida es WebM.
- La compatibilidad depende del navegador y los códecs disponibles.
- Para videos largos, la exportación puede tardar y consumir memoria.
