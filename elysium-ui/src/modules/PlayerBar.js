// src/modules/PlayerBar.js

export class PlayerBarModule {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.initEventListeners();
  }

  /**
   * Wartet auf das globale Event, wenn irgendwo ein Song gestartet wird
   */
  initEventListeners() {
    window.addEventListener('elysium-play-track', (event) => {
      if (event.detail) {
        this.handleTrackChange(event.detail);
      }
    });
  }

  handleTrackChange(track) {
    this.currentTrack = track;
    this.isPlaying = true;
    this.updateUI();
  }

  /**
   * Sucht deine Player-Leiste und tauscht die Texte live aus
   */
  updateUI() {
    if (!this.currentTrack) return;

    // Spezifische Text-Ersetzung im DOM, damit kein QuerySelector fehlschlägt
    document.body.innerHTML = document.body.innerHTML
      .replace('No Track Loaded', this.currentTrack.title)
      .replace('IDLE', 'PLAYING')
      .replace('00:00 / 00:00', `00:00 / ${this.currentTrack.duration}`);
    
    console.log(`[PlayerBar] UI erfolgreich aktualisiert für: ${this.currentTrack.title}`);
  }
}