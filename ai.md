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
8. **Multi-Plattform:** Die App soll auf Windows und Linux laufen. Später auch noch Android & macOS. Und bereit sein für iOS & Web, aber das kommt erst ganz spät. PASSE AUF DAS ALLES AUF ALLEN PLATTFORMEN LÄUFT UND NICHT WINDOWS-only ist
9. **Abhängigkeiten:** Ich möchte keine riesigen .exe-Dateien für Abhängigkeiten in meinem Programm haben, sondern Live Installer und Updater, die fragen wenn man das Programm startet.
10.**Alte Dateien:** Entferne dateien und v.a. Große dateien die man nicht mehr benötigt. Fügt dateien die nicht auf git sein sollen in die .gitignore ein.
11.**Keine Faulheit:** Du hältst dich strikt an alle Regeln und suchst nie den schnellsten, sondern den architektonisch besten Weg. Kürze NIEMALS Code ab (kein // TODO, kein // ... restlicher Code ...). Schreibe immer den vollständigen, voll funktionsfähigen Code aus!
12.**Sprachsystem:** Du machst ein ultra-modulares Sprachsystem. Basierend aus Loadern, und den Sprachdateien zu einzelnen Sprachen z.B. de.js. In den Einzelnen Sprachdateien stehen dann die Übersetzungen. Du verwendest gefälligst keine Hardcoded Übersetzungen in dem Code!
13.**Selber gucken:** Am Ende deiner Arbeit sollst du selber gucken ob du die Regeln eingehalten hast, wenn nein es mir sagen und nochmal kurz rangehen. Du sollst selber Stichproben an alten Dateien nehmen, ob man die noch kürzen und modularisieren, verbessern kann. Neue Dateien selbstverständlich streng an diese Regeln halten.
14.**Testen:** Mit npx tauri dev kannst du selber testen ob das Programm kompiliert, startet und sogar einzelne Funktionen innerhalb des Programms sehen und testen.