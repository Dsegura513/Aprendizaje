const video = document.getElementById('videoPreview');
const input = document.getElementById('videoInput');
const scrubber = document.getElementById('scrubber');
const timeLabel = document.getElementById('timeLabel');

const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const applyTrimBtn = document.getElementById('applyTrimBtn');
const exportBtn = document.getElementById('exportBtn');

const trimStart = document.getElementById('trimStart');
const trimEnd = document.getElementById('trimEnd');
const volume = document.getElementById('volume');
const playbackRate = document.getElementById('playbackRate');
const rateValue = document.getElementById('rateValue');

const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const saturate = document.getElementById('saturate');
const sepia = document.getElementById('sepia');
const grayscale = document.getElementById('grayscale');

const overlay = document.getElementById('textOverlay');
const overlayText = document.getElementById('overlayText');
const overlaySize = document.getElementById('overlaySize');
const overlayColor = document.getElementById('overlayColor');
const overlayX = document.getElementById('overlayX');
const overlayY = document.getElementById('overlayY');

const exportStatus = document.getElementById('exportStatus');
const downloadLink = document.getElementById('downloadLink');
const renderCanvas = document.getElementById('renderCanvas');

let trim = { start: 0, end: 0 };
let renderLoopHandle = null;

const format = (n) => Number(n).toFixed(2);

const updateTimeLabel = () => {
  timeLabel.textContent = `${format(video.currentTime)} / ${format(video.duration || 0)} s`;
};

const syncScrubberBounds = () => {
  scrubber.max = video.duration || 0;
  scrubber.value = video.currentTime || 0;
  trimEnd.value = format(video.duration || 0);
  trim.end = video.duration || 0;
  updateTimeLabel();
};

const applyVideoFilters = () => {
  video.style.filter = `brightness(${brightness.value}) contrast(${contrast.value}) saturate(${saturate.value}) sepia(${sepia.value}) grayscale(${grayscale.value})`;
};

const syncOverlay = () => {
  overlay.textContent = overlayText.value;
  overlay.style.fontSize = `${overlaySize.value}px`;
  overlay.style.color = overlayColor.value;
  overlay.style.left = `${overlayX.value}%`;
  overlay.style.top = `${overlayY.value}%`;
};

const validateTrim = () => {
  const start = Math.max(0, Number(trimStart.value));
  const end = Math.min(video.duration || Number(trimEnd.value), Number(trimEnd.value));

  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
    alert('Recorte inválido: verifica que inicio < fin.');
    return false;
  }

  trim = { start, end };
  video.currentTime = start;
  scrubber.value = start;
  return true;
};

const stopVideo = () => {
  video.pause();
  video.currentTime = trim.start || 0;
  scrubber.value = video.currentTime;
  updateTimeLabel();
};

const drawFrameToCanvas = (ctx, width, height) => {
  const filter = getComputedStyle(video).filter;
  ctx.clearRect(0, 0, width, height);
  ctx.filter = filter;
  ctx.drawImage(video, 0, 0, width, height);
  ctx.filter = 'none';

  if (overlay.textContent) {
    const x = (Number(overlayX.value) / 100) * width;
    const y = (Number(overlayY.value) / 100) * height;
    ctx.font = `700 ${overlaySize.value}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = overlayColor.value;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = Math.max(2, Number(overlaySize.value) * 0.06);
    ctx.strokeText(overlay.textContent, x, y);
    ctx.fillText(overlay.textContent, x, y);
  }
};

const exportEditedClip = async () => {
  if (!video.src || !validateTrim()) {
    return;
  }

  exportBtn.disabled = true;
  downloadLink.hidden = true;
  exportStatus.textContent = 'Exportando...';

  const fps = 30;
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;

  renderCanvas.width = width;
  renderCanvas.height = height;
  const ctx = renderCanvas.getContext('2d');

  const stream = renderCanvas.captureStream(fps);
  const audioStream = video.captureStream?.();

  if (audioStream) {
    audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
  }

  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 6_000_000
  });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const finished = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  video.currentTime = trim.start;
  video.playbackRate = Number(playbackRate.value);
  await video.play();
  recorder.start();

  renderLoopHandle = setInterval(() => {
    drawFrameToCanvas(ctx, width, height);
    exportStatus.textContent = `Exportando... ${format(video.currentTime)}s`;

    if (video.currentTime >= trim.end || video.ended) {
      clearInterval(renderLoopHandle);
      video.pause();
      recorder.stop();
    }
  }, 1000 / fps);

  await finished;
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);

  downloadLink.href = url;
  downloadLink.download = `clip-editado-${Date.now()}.webm`;
  downloadLink.hidden = false;
  downloadLink.textContent = '⬇ Descargar video exportado';
  exportStatus.textContent = `Exportación lista (${(blob.size / 1024 / 1024).toFixed(2)} MB).`;
  exportBtn.disabled = false;
};

input.addEventListener('change', () => {
  const file = input.files?.[0];
  if (!file) return;

  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  video.load();
  video.onloadedmetadata = () => {
    syncScrubberBounds();
    trimStart.value = '0';
    applyVideoFilters();
    syncOverlay();
  };
});

video.addEventListener('timeupdate', () => {
  if (video.currentTime >= trim.end && trim.end > 0) {
    video.pause();
  }
  scrubber.value = video.currentTime;
  updateTimeLabel();
});

scrubber.addEventListener('input', () => {
  video.currentTime = Number(scrubber.value);
  updateTimeLabel();
});

playBtn.addEventListener('click', () => {
  if (video.currentTime < trim.start || video.currentTime >= trim.end) {
    video.currentTime = trim.start;
  }
  video.play();
});

pauseBtn.addEventListener('click', () => video.pause());
stopBtn.addEventListener('click', stopVideo);
applyTrimBtn.addEventListener('click', validateTrim);

volume.addEventListener('input', () => {
  video.volume = Number(volume.value);
});

playbackRate.addEventListener('input', () => {
  const rate = Number(playbackRate.value);
  video.playbackRate = rate;
  rateValue.textContent = `${rate.toFixed(2)}x`;
});

[brightness, contrast, saturate, sepia, grayscale].forEach((control) => {
  control.addEventListener('input', applyVideoFilters);
});

[overlayText, overlaySize, overlayColor, overlayX, overlayY].forEach((control) => {
  control.addEventListener('input', syncOverlay);
});

exportBtn.addEventListener('click', exportEditedClip);
