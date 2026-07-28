Unter tauri.conf.json kann man Version, Name und Minimale/Standard-Fenstergröße ändern.

Git:


Plan:
- Dateien löschen(0.6)
- API-Key(0.6)
- Pre-Song-Load (Hyperload) (1.0) rust
- Playlist & Playerbar Modularisieren (1.0)
Baue das Feature [XY] nach demselben Architektur-Muster wie das Popup/Toast-System (popup.md): Vollkommen entkoppelt, event-basiert, strikt typisiert, unter 150 Zeilen pro Datei und ohne direkte Kopplung an das bestehende UI.