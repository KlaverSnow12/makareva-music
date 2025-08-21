const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("play"); // 1 tombol play/pause
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

let trackIndex = 0;
let repeatMode = "none"; // none | all | one

// Load lagu
function loadTrack(index) {
  for (let i = 0; i < playlist.length; i++) {
    playlist[i].classList.remove("active");
  }
  playlist[index].classList.add("active");
  audio.src = playlist[index].getAttribute("data-src");
  currentTrack.textContent = playlist[index].textContent;

  // reset waktu saat ganti lagu
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
}

// Play / Pause toggle
function togglePlayPause() {
  if (audio.paused) {
    audio.play();
    playPauseBtn.innerHTML = `<span class="material-symbols-outlined">pause</span>`;
  } else {
    audio.pause();
    playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`;
  }
}

function stopTrack() {
  audio.pause();
  audio.currentTime = 0;
  progress.value = 0;
  playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`;
}

function nextTrack() {
  if (trackIndex < playlist.length - 1) {
    trackIndex++;
  } else if (repeatMode === "all") {
    trackIndex = 0;
  } else {
    return;
  }
  loadTrack(trackIndex);
  audio.play();
  playPauseBtn.innerHTML = `<span class="material-symbols-outlined">pause</span>`;
}

function prevTrack() {
  if (trackIndex > 0) {
    trackIndex--;
  } else if (repeatMode === "all") {
    trackIndex = playlist.length - 1;
  } else {
    return;
  }
  loadTrack(trackIndex);
  audio.play();
  playPauseBtn.innerHTML = `<span class="material-symbols-outlined">pause</span>`;
}

// Repeat toggle
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

// Playlist click
for (let i = 0; i < playlist.length; i++) {
  playlist[i].addEventListener("click", () => {
    trackIndex = i;
    loadTrack(trackIndex);
    audio.play();
    playPauseBtn.innerHTML = `<span class="material-symbols-outlined">pause</span>`;
  });
}

// Auto play next / repeat logic
audio.addEventListener("ended", () => {
  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
  } else if (repeatMode === "all" || trackIndex < playlist.length - 1) {
    nextTrack();
  } else {
    // kalau repeat off & lagu terakhir habis → reset tombol jadi play
    playPauseBtn.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`;
  }
});

// Format waktu mm:ss
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Update progress & timer
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progress.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

// Update durasi saat metadata siap
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (progress.value / 100) * audio.duration;
  }
});

// Button controls
playPauseBtn.addEventListener("click", togglePlayPause);
stopBtn.addEventListener("click", stopTrack);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);

// 🎵 Tambahan: Play/Pause pakai tombol spasi
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault(); // cegah scroll
    togglePlayPause();
  }
});

// Load pertama
loadTrack(trackIndex);
