const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const AudioManager = {
  muted: false,
  bgmAudio: new Audio(),
  currentBGM: null,
  
  // BGM URLs (Placeholder Royalty-free tracks from SoundHelix)
  tracks: {
    lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Relaxed
    battle: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', // Faster
    boss: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'    // Intense
  },

  init() {
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.3; // Default volume for background music

    // Resume AudioContext on user interaction if suspended
    const resumeAudio = () => {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
  },

  toggleMute() {
    this.muted = !this.muted;
    this.bgmAudio.muted = this.muted;
    return this.muted;
  },

  playBGM(trackName) {
    if (this.currentBGM === trackName) return;
    this.currentBGM = trackName;
    
    if (this.tracks[trackName]) {
      this.bgmAudio.src = this.tracks[trackName];
      if (!this.muted) {
        this.bgmAudio.play().catch(e => console.log('BGM Play prevented by browser:', e));
      }
    }
  },

  // --- Sound Effects using Web Audio API for zero latency ---
  playTone(freq, type, duration, vol = 0.1) {
    if (this.muted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  },

  playNoise(duration, vol = 0.1) {
    if (this.muted || audioCtx.state === 'suspended') return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter for "hit" or "swing" effect
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
  },

  playSFX(effect) {
    if (this.muted || audioCtx.state === 'suspended') return;
    const now = audioCtx.currentTime;

    switch (effect) {
      case 'click': // UI Click (Short Wood/Paper sound)
        this.playTone(600, 'sine', 0.1, 0.2);
        break;
      case 'attack': // Sword Swing
        this.playNoise(0.2, 0.4);
        this.playTone(800, 'triangle', 0.1, 0.1);
        break;
      case 'hit': // Monster Hit
        this.playTone(150, 'square', 0.2, 0.3);
        this.playNoise(0.3, 0.3);
        break;
      case 'kill': // Monster Dead
        this.playTone(100, 'sawtooth', 0.5, 0.3);
        break;
      case 'boss_spawn': // Boss roar
        this.playTone(80, 'sawtooth', 2.0, 0.5);
        this.playNoise(2.0, 0.5);
        break;
      case 'correct': // Magic Chime
        this.playTone(523.25, 'sine', 0.1, 0.2); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.2), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.2), 200); // G5
        break;
      case 'wrong': // Buzzer
        this.playTone(150, 'sawtooth', 0.3, 0.3);
        setTimeout(() => this.playTone(120, 'sawtooth', 0.4, 0.3), 200);
        break;
      case 'gameover': // Fanfare
        this.playTone(440, 'square', 0.3, 0.2);
        setTimeout(() => this.playTone(440, 'square', 0.3, 0.2), 300);
        setTimeout(() => this.playTone(440, 'square', 0.3, 0.2), 600);
        setTimeout(() => this.playTone(587.33, 'square', 0.6, 0.2), 900);
        break;
    }
  }
};

AudioManager.init();
