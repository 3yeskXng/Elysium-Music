// modules/player.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = {
    isPaused: false,
    audioProcess: null,
    duration: 0,
    currentSeconds: 0,
    progressInterval: null,

    // --- CLI-KOMPATIBILITÄTS-PROPERTIES ---
    get isPlaying() { return !!this.audioProcess; },
    get playing() { return !!this.audioProcess; },
    pause() { if (!this.isPaused) this.togglePause(true); },
    resume() { if (this.isPaused) this.togglePause(false); },

    /**
     * Schaltet Pause/Fortsetzen um, indem ein echtes 'p' an den Player gesendet wird.
     */
    togglePause(shouldPause) {
        if (!this.audioProcess) return;

        if (shouldPause === undefined) {
            this.isPaused = !this.isPaused;
        } else {
            this.isPaused = shouldPause;
        }

        try {
            // Der "normale" Weg: Wir schreiben direkt 'p' in den Input-Stream des Players.
            // Das kapieren ffplay und mpv auf JEDEM Betriebssystem sofort.
            this.audioProcess.stdin.write('p');
        } catch (e) {
            console.error("[Elysium Player] Fehler beim Senden des Steuerbefehls:", e.message);
        }
    },

    /**
     * Startet die Audiowiedergabe nativ über ffplay oder mpv.
     */
    play(target, onExit, onProgress) {
        // Falls noch ein alter Song läuft: sauber beenden
        this.stop(); 

        this.isPaused = false;
        this.currentSeconds = 0;
        this.duration = 0;

        let cmd = 'ffplay';
        let args = ['-nodisp', '-autoexit', '-loglevel', 'quiet', target];

        // Lokaler Windows-Fallback, falls ffplay im bin-Ordner liegt
        if (process.platform === 'win32' && fs.existsSync('./bin/ffplay.exe')) {
            cmd = path.resolve('./bin/ffplay.exe');
        }

        try {
            // WICHTIG: 'pipe' an erster Stelle öffnet den stdin-Kanal für unsere Befehle!
            this.audioProcess = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
        } catch (err) {
            try {
                cmd = 'mpv';
                args = ['--no-video', '--quiet', target];
                this.audioProcess = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
            } catch (e) {
                console.log("\n[Elysium Player] ❌ Kritischer Fehler: Weder ffplay noch mpv wurden im System gefunden!");
                if (onExit) onExit();
                return;
            }
        }

        // Sekundengenaue Zeiterfassung für deine CLI-Anzeige
        this.progressInterval = setInterval(() => {
            if (this.isPaused || !this.audioProcess) return;

            this.currentSeconds++;
            
            if (this.duration === 0) {
                this.duration = 187; // Standard-Fallback (3:07 min) aus deinem Log
            }

            if (this.currentSeconds >= this.duration) {
                this.stop();
            } else {
                if (onProgress) onProgress(this.currentSeconds, this.duration);
            }
        }, 1000);

        // Liest die echte Songlänge aus den ffplay/mpv Metadaten aus
        const parseMetadata = (data) => {
            const str = data.toString();
            const durationMatch = str.match(/Duration:\s*(\d+):(\d+):(\d+)/i);
            if (durationMatch) {
                const h = parseInt(durationMatch[1]), m = parseInt(durationMatch[2]), s = parseInt(durationMatch[3]);
                this.duration = (h * 3600) + (m * 60) + s;
            }
        };

        this.audioProcess.stdout.on('data', parseMetadata);
        this.audioProcess.stderr.on('data', parseMetadata);

        // Wenn der Song vorbei ist
        this.audioProcess.on('exit', () => {
            if (this.progressInterval) clearInterval(this.progressInterval);
            this.audioProcess = null;
            if (onExit) onExit();
        });
    },

    /**
     * Stoppt die Wiedergabe über das native 'q' (Quit) Signal.
     */
    stop() {
        this.isPaused = false;
        if (this.progressInterval) clearInterval(this.progressInterval);
        
        if (this.audioProcess) {
            try {
                // Schickt 'q' an den Player, damit er sich augenblicklich schließt
                this.audioProcess.stdin.write('q');
            } catch (e) {
                try { this.audioProcess.kill('SIGKILL'); } catch (err) {}
            }
            this.audioProcess = null;
        }
    }
};