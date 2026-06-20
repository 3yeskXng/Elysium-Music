import os
import sys
import subprocess
import threading
import time
from pynput import keyboard

class ElysiumAudioEngine:
    def __init__(self):
        self.audio_process = None
        self.is_paused = False
        self.current_track = None
        self.lock = threading.Lock()
        
        # Startet den globalen Key-Listener im Hintergrund-Thread
        self.listener = keyboard.Listener(on_press=self._on_global_key)
        self.listener.start()

    def _on_global_key(self, key):
        """Reagiert auf die echte Play/Pause-Taste deiner Tastatur."""
        try:
            if key == keyboard.Key.media_play_pause:
                self.toggle_playback()
        except AttributeError:
            pass

    def play(self, file_path):
        """Startet die Wiedergabe einer hochauflösenden Opus- oder MP3-Datei."""
        with self.lock:
            self.stop()
            
            if not os.path.exists(file_path):
                print(f"\n❌ Datei nicht gefunden: {file_path}")
                return
            
            self.current_track = file_path
            self.is_paused = False
            
            # Player-Auswahl: ffplay bevorzugt, mpv als Fallback
            cmd = "ffplay"
            args = ["-nodisp", "-autoexit", "-loglevel", "quiet", file_path]
            
            # Windows-spezifischer lokaler Pfad-Fallback
            if sys.platform == "win32" and os.path.exists("./bin/ffplay.exe"):
                cmd = os.path.abspath("./bin/ffplay.exe")
                
            try:
                # WICHTIG: stdin=subprocess.PIPE erlaubt es uns, Steuerbefehle zu senden
                self.audio_process = subprocess.Popen(
                    [cmd] + args[1:],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                print(f"\n▶️  [Elysium] Spiele: {os.path.basename(file_path)}")
            except FileNotFoundError:
                # Fallback auf MPV
                try:
                    cmd = "mpv"
                    args = ["--no-video", "--quiet", file_path]
                    self.audio_process = subprocess.Popen(
                        [cmd] + args[1:],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    print(f"\n▶️  [Elysium] Spiele (via mpv): {os.path.basename(file_path)}")
                except FileNotFoundError:
                    print("\n❌ Kritischer Fehler: Weder 'ffplay' noch 'mpv' im System-PFAD gefunden!")
                    self.audio_process = None

    def toggle_playback(self):
        """Pausiert oder setzt die Wiedergabe plattformunabhängig fort."""
        with self.lock:
            # Prüfen, ob überhaupt ein Prozess aktiv lebt
            if not self.audio_process or self.audio_process.poll() is not None:
                print("\n[Elysium] Aktuell läuft keine Musik.")
                return
            
            try:
                # Nativer Trick: Sowohl ffplay als auch mpv toggeln Pause bei 'p' über stdin
                self.audio_process.stdin.write(b'p')
                self.audio_process.stdin.flush()
                
                self.is_paused = not self.is_paused
                status = "⏸️  GEPAUST" if self.is_paused else "▶️  FORTGESETZT"
                print(f"\n[Elysium] {status}")
            except Exception as e:
                print(f"\n❌ Fehler bei der Player-Ansteuerung: {e}")

    def stop(self):
        """Beendet den Song und räumt den Prozess sauber auf."""
        if self.audio_process and self.audio_process.poll() is None:
            try:
                # 'q' sendet den nativen Quit-Befehl an ffplay/mpv
                self.audio_process.stdin.write(b'q')
                self.audio_process.stdin.flush()
                self.audio_process.wait(timeout=1)
            except Exception:
                try:
                    self.audio_process.terminate()
                except Exception:
                    pass
        self.audio_process = None
        self.is_paused = False


# --- INTERAKTIVE TEST-CLI ---
if __name__ == "__main__":
    engine = ElysiumAudioEngine()
    print("=" * 50)
    print(" ELYSIUM PYTHON AUDIO ENGINE (Opus Native Support)")
    print("=" * 50)
    print("Befehle: play <pfad> | pause | stop | exit")
    print("Deine globalen Medientasten funktionieren ab jetzt parallel!")
    print("-" * 50)

    while True:
        try:
            user_input = input("ELYSIUM> ").strip().split(" ", 1)
            cmd = user_input[0].lower()
            
            if cmd == "exit":
                engine.stop()
                break
            elif cmd == "play":
                if len(user_input) > 1:
                    # Pfad von eventuellen Anführungszeichen bereinigen
                    track_path = user_input[1].replace('"', '').replace("'", "")
                    engine.play(track_path)
                else:
                    print("Bitte gib einen Dateipfad an! (z.B. play downloads/numb.opus)")
            elif cmd == "pause":
                engine.toggle_playback()
            elif cmd == "stop":
                engine.stop()
                print("[Elysium] Wiedergabe gestoppt.")
            elif cmd == "":
                pass
            else:
                print(f"Unbekannter Befehl: {cmd}")
        except (KeyboardInterrupt, SystemExit):
            engine.stop()
            break