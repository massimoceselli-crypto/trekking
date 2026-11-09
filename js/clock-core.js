/**
 * clock-core.js - Modulo estratto da Orologio Gemini per SentieroVivo
 * Gestisce: Orologio digitale, Wake Lock (schermo sempre attivo) e Timer di marcia.
 */
export class TrailClock {
  constructor(options = {}) {
    this.onTick = options.onTick || null;
    this.onTimerTick = options.onTimerTick || null;
    this.wakeLock = null;
    
    // Stato Timer Marcia
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.isTimerRunning = false;
  }

  /**
   * Avvia l'aggiornamento dell'orologio in tempo reale (hh:mm:ss)
   */
  startClock() {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      if (this.onTick) {
        this.onTick({ hours, minutes, seconds, fullTime: `${hours}:${minutes}:${seconds}` });
      }
    };
    update();
    setInterval(update, 1000);
  }

  /**
   * Gestione dello Schermo Sempre Acceso (Screen Wake Lock API)
   */
  async toggleWakeLock() {
    if (!('wakeLock' in navigator)) {
      console.warn("La Screen Wake Lock API non è supportata da questo browser.");
      return false;
    }
    try {
      if (this.wakeLock !== null) {
        await this.wakeLock.release();
        this.wakeLock = null;
        return false; // Wake lock disattivato
      } else {
        this.wakeLock = await navigator.wakeLock.request('screen');
        
        // Riconnetti automaticamente se l'utente cambia scheda e torna sull'app
        document.addEventListener('visibilitychange', async () => {
          if (this.wakeLock !== null && document.visibilityState === 'visible') {
            this.wakeLock = await navigator.wakeLock.request('screen');
          }
        });

        return true; // Wake lock attivo
      }
    } catch (err) {
      console.error(`Errore Wake Lock: ${err.name}, ${err.message}`);
      return false;
    }
  }

  /**
   * Avvia o riprende il Timer di Marcia per l'escursione
   */
  startTimer() {
    if (this.isTimerRunning) return;
    this.isTimerRunning = true;
    
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      if (this.onTimerTick) {
        this.onTimerTick(this.formatElapsedTime(this.elapsedSeconds));
      }
    }, 1000);
  }

  /**
   * Pausa il Timer di Marcia
   */
  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
  }

  /**
   * Azzera il Timer di Marcia
   */
  resetTimer() {
    this.pauseTimer();
    this.elapsedSeconds = 0;
    if (this.onTimerTick) {
      this.onTimerTick("00:00:00");
    }
  }

  /**
   * Utilità: Formatta i secondi accumulati in HH:MM:SS
   */
  formatElapsedTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  }
}
