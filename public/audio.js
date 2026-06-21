const AudioManager = {
  muted: false,
  bgmAudio: new Audio(),
  currentBGMTrack: null,

  // High-quality royalty-free background music tracks
  bgmTracks: {
    lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', // Relaxed & Ambient
    battle: '/battle.mp3', // Battlefield music (Loaded locally to bypass block)
    boss: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'    // Intense & Epic
  },

  // Realistic Sound Effects from public open-source game assets (Phaser 3 examples repo)
  sfxFiles: {
    click: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/key.wav',
    attack: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/squit.mp3',
    hit: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/sword.mp3',
    kill: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/alien_death1.wav',
    boss_spawn: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/explosion.mp3',
    correct: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/p-ping.mp3',
    wrong: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/blaster.mp3',
    gameover: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/p-ping.mp3'
  },

  sfxAudio: {},
  lastSfxTime: {},

  init() {
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.3; // Default volume

    // Preload SFX into Audio objects for low-latency playback
    for (const [key, url] of Object.entries(this.sfxFiles)) {
      this.sfxAudio[key] = new Audio(url);

      // Adjust volumes for realism
      if (key === 'attack') this.sfxAudio[key].volume = 0.5;
      else if (key === 'hit') this.sfxAudio[key].volume = 0.4;
      else if (key === 'kill') this.sfxAudio[key].volume = 0.6;
      else if (key === 'boss_spawn') this.sfxAudio[key].volume = 0.8;
      else this.sfxAudio[key].volume = 0.4;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    this.bgmAudio.muted = this.muted;
    return this.muted;
  },

  playBGM(trackName) {
    if (this.currentBGMTrack === trackName) return;
    this.currentBGMTrack = trackName;

    if (this.bgmTracks[trackName]) {
      this.bgmAudio.src = this.bgmTracks[trackName];

      // ลดเสียง BGM ลงครึ่งหนึ่งถ้าเป็นฉากต่อสู้ เพื่อไม่ให้กลบเสียง Effect
      this.bgmAudio.volume = trackName === 'battle' ? 0.15 : 0.3;

      if (!this.muted) {
        this.bgmAudio.play().catch(e => console.log('BGM playback prevented by browser:', e));
      }
    }
  },

  playSFX(effect) {
    if (this.muted) return;

    // Throttle spammy sounds
    if (effect === 'attack' || effect === 'hit') {
      const now = Date.now();
      if (this.lastSfxTime[effect] && now - this.lastSfxTime[effect] < 100) return;
      this.lastSfxTime[effect] = now;
    }

    const sound = this.sfxAudio[effect];
    if (sound) {
      // Clone the node so rapid repeated SFX don't cut each other off
      const clone = sound.cloneNode();
      clone.volume = sound.volume;
      clone.play().catch(e => console.log('SFX playback prevented:', e));
    }
  }
};

AudioManager.init();
