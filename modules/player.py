# modules/player.py
import sys
import os
import subprocess

# Erzwingt, dass Python Ausgaben sofort sendet
sys.stdout.reconfigure(line_buffering=True)

audio_process = None

cmd = "ffplay"
if sys.platform == "win32" and os.path.exists("./bin/ffplay.exe"):
    cmd = os.path.abspath("./bin/ffplay.exe")

for line in sys.stdin:
    parts = line.strip().split(" ", 1)
    action = parts[0]
    
    if action == "PLAY" and len(parts) > 1:
        if audio_process and audio_process.poll() is None:
            try: audio_process.stdin.write(b'q'); audio_process.stdin.flush()
            except: pass
        
        file_path = parts[1]
        args = ["-nodisp", "-autoexit", "-loglevel", "quiet", file_path]
        try:
            audio_process = subprocess.Popen([cmd] + args, stdin=subprocess.PIPE)
            print("STARTED")
        except:
            print("ERROR")
            
    elif action == "TOGGLE":
        if audio_process and audio_process.poll() is None:
            try:
                audio_process.stdin.write(b'p')
                audio_process.stdin.flush()
                print("TOGGLED")
            except: pass
            
    elif action == "STOP":
        if audio_process and audio_process.poll() is None:
            try: audio_process.stdin.write(b'q'); audio_process.stdin.flush()
            except: pass
        print("STOPPED")