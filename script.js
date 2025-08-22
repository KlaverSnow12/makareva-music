// ===== Element =====
const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("play");
const stopBtn = document.getElementById("stop");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const repeatBtn = document.getElementById("repeat");
const repeatIcon = repeatBtn.querySelector("span");
const progress = document.getElementById("progress");
const currentTrack = document.getElementById("current-track");
const playlist = document.getElementById("playlist").getElementsByTagName("li");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

// ===== State =====
let trackIndex = 0;
let repeatMode = "none"; // none | all | one
let isSeeking = false;

// ===== Visualizer =====
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
let canvasWidth, canvasHeight;

function resizeCanvas() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight * 0.3; // 30% tinggi layar
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let audioCtx, analyser, source;
let dataArray, bufferLength;
let visualizerRunning = false;

// ===== Load Track =====
function loadTrack(index) {
  for (let i = 0; i < playlist.length; i++) playlist[i].classList.remove("active", "playing");
  playlist[index].classList.add("active", "playing");
  audio.src = playlist[index].getAttribute("data-src");

  currentTrack.classList.add("fade");
  setTimeout(() => {
    currentTrack.textContent = playlist[index].textContent;
    currentTrack.classList.remove("fade");
  }, 200);

  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
}

// ===== Init AudioContext =====
function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
}

// ===== Controls =====
function togglePlayPause() {
  initAudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!visualizerRunning) drawVisualizer();

  if (audio.paused) audio.play();
  else audio.pause();
}

function stopTrack() {
  audio.pause();
  audio.currentTime = 0;
  progress.value = 0;
}

function nextTrack() {
  if(trackIndex < playlist.length - 1) trackIndex++;
  else if(repeatMode === "all") trackIndex = 0;
  else return;
  loadTrack(trackIndex);
  audio.play();
}

function prevTrack() {
  if(trackIndex > 0) trackIndex--;
  else if(repeatMode === "all") trackIndex = playlist.length - 1;
  else return;
  loadTrack(trackIndex);
  audio.play();
}

// ===== Repeat =====
repeatBtn.addEventListener("click", () => {
  repeatBtn.classList.remove("active");
  if (repeatMode === "none") {
    repeatMode = "all";
    repeatIcon.textContent = "repeat";
    repeatBtn.classList.add("active");
  } else if (repeatMode === "all") {
    repeatMode = "one";
    repeatIcon.textContent = "repeat_one";
    repeatBtn.classList.add("active");
  } else {
    repeatMode = "none";
    repeatIcon.textContent = "repeat";
  }
});

// ===== Playlist click =====
for (let i = 0; i < playlist.length; i++) {
  playlist[i].addEventListener("click", () => {
    trackIndex = i;
    loadTrack(trackIndex);
    togglePlayPause();
  });
}

// ===== Auto play next =====
audio.addEventListener("ended", () => {
  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
  } else if (repeatMode === "all" || trackIndex < playlist.length - 1) {
    nextTrack();
  } else {
    playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`;
  }
});

// ===== Format Time =====
function formatTime(s) {
  const m = Math.floor(s / 60) || 0;
  const sec = Math.floor(s % 60) || 0;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

// ===== Update progress =====
audio.addEventListener("timeupdate", () => {
  if (!isSeeking && audio.duration) {
    progress.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

// ===== Progress drag/click (desktop + mobile) =====
function startSeek() { isSeeking = true; }

function endSeek(e) {
  isSeeking = false;
  if (!audio.duration) return;

  const rect = progress.getBoundingClientRect();
  let clientX;
  if (e.type.startsWith("touch")) clientX = e.changedTouches[0].clientX;
  else clientX = e.clientX;

  const value = ((clientX - rect.left) / rect.width) * 100;
  audio.currentTime = (value / 100) * audio.duration;
  progress.value = value;
}

function seeking(e) {
  if (!isSeeking || !audio.duration) return;

  const rect = progress.getBoundingClientRect();
  let clientX;
  if (e.type.startsWith("touch")) clientX = e.touches[0].clientX;
  else clientX = e.clientX;

  const value = ((clientX - rect.left) / rect.width) * 100;
  currentTimeEl.textContent = formatTime((value / 100) * audio.duration);
  progress.value = value;
}

// Mouse events
progress.addEventListener("mousedown", startSeek);
progress.addEventListener("mousemove", seeking);
progress.addEventListener("mouseup", endSeek);
progress.addEventListener("click", endSeek);

// Touch events
progress.addEventListener("touchstart", startSeek);
progress.addEventListener("touchmove", seeking);
progress.addEventListener("touchend", endSeek);

// ===== Button controls =====
playPauseBtn.addEventListener("click", togglePlayPause);
stopBtn.addEventListener("click", stopTrack);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);

// ===== Update Play/Pause icon =====
audio.addEventListener("pause", () => {
  playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`;
});
audio.addEventListener("play", () => {
  playPauseBtn.innerHTML = `<span class="material-symbols-outlined">pause</span>`;
});

// ===== Keyboard shortcuts =====
document.addEventListener("keydown", (e) => {
  switch(e.code){
    case "Space": e.preventDefault(); togglePlayPause(); break;
    case "ArrowRight": nextTrack(); break;
    case "ArrowLeft": prevTrack(); break;
    case "KeyS": stopTrack(); break;
  }
});

// ===== Error =====
audio.addEventListener("error", () => {
  alert("Gagal memuat lagu: " + playlist[trackIndex].textContent);
  nextTrack();
});

// ===== Load first =====
loadTrack(trackIndex);

// ===== Visualizer =====
function drawVisualizer() {
  visualizerRunning = true;
  requestAnimationFrame(drawVisualizer);

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const radius = canvasHeight / 3;
  const barWidth = Math.max(canvasWidth / bufferLength * 2.5, 2);

  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] / 1.5;

    // ===== Linear Bar =====
    const gradient = ctx.createLinearGradient(0, canvasHeight - barHeight, 0, canvasHeight);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.5, "yellow");
    gradient.addColorStop(1, "blue");
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "white";
    ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
    x += barWidth + 1;

    // ===== Circular Radial =====
    const angle = (i / bufferLength) * 2 * Math.PI;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + barHeight * 0.5);
    const y2 = cy + Math.sin(angle) * (radius + barHeight * 0.5);

    ctx.strokeStyle = `hsl(${i * 4}, 100%, 50%)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${i * 4}, 100%, 70%)`;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}
