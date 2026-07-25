# ELYSIUM ARCHITECTURE RULES

1. **Modularität:** Schreibe NIEMALS riesige Monolith-Dateien. Lagere Logik immer in kleine, spezialisierte Module aus.
2. **Dateigröße:** Wenn eine Datei länger als ~150 Zeilen wird, teile sie in Untermodule auf.
3. **Loader & Async-Feedback:** Jede Aktion, die Zeit braucht (Netzwerk-Requests, Download, Rust-IPC), MUSS zwingend einen Loader/Spinner-Status in der UI feuern. Praktisch eine Loader datei und mehrere klene unterdateien siehe 2.
4. **Tech-Stack:** Tauri, JS, Rust und Moderne Sprachen generell!
5. **Codekommentare:** Schreibe ganz oben hin wofür die Datei ist und mache die Kommentare auf English!
6. **App-Info:** In /elysium-ui/src/config/appInfo.js findest du eine Datei wo immer die aktuelle Version drin stehen soll. Ändere das nur wenn ich es dir sage. Wenn ich dir sage das du es bspw. auf 0.4.0 ändern sollst machst du es in der Appinfo.js, elysium-ui\src-tauri\cargo.toml und tauri.conf.json!
7. **Modularitäts-Beispiel:** Statt bspw. eine downloadModule.js lieber: 
src/modules/download/
├── DownloadView.js          <-- Nur das HTML/UI-Layout (Rendern & Events)
├── services/
│   ├── youtubeService.js    <-- Nur die Logik für yt-dlp & Downloads
│   └── localImportService.js<-- Nur das Einlesen lokaler Dateien
! Das gilt für alle neuen & teils alten Dateien in diesem Repo!