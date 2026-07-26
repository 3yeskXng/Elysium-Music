# ELYSIUM ARCHITECTURE RULES

1. **Modularität:** Schreibe NIEMALS riesige Monolith-Dateien. Lagere Logik immer in kleine, spezialisierte Module aus.
2. **Dateigröße:** Wenn eine Datei länger als ~150 Zeilen wird, teile sie in Untermodule auf. Bevor du eine Datei speicherst oder neu erstellst, ZÄHLE die Zeilen. Wenn eine Datei 150 Zeilen erreicht, MUSS der Schreibprozess sofort gestoppt und die Datei aufgeteilt werden. Du gibst im Chat vor jedem Code-Block die genaue Zeilenzahl an (z. B. [Zeilen: 112/150]). Das Überschreiten der Dateilänge ist ein Stopp-Signal – KEIN Grund für einen HACK!!!-Kommentar!
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
13.**Selber gucken:** Du hälst du dich strikt an unsere Regeln und gehts nach JEDEM Code den du geschrieben hast durch ob du dich wirklich drangehalten hast und besserst im Zweifelsfall nach! Du sollst selber Stichproben an alten Dateien nehmen, ob man die noch kürzen und modularisieren, verbessern kann. Neue Dateien selbstverständlich streng an diese Regeln halten. 
14.**Testen:** Mit npx tauri dev kannst du selber testen ob das Programm kompiliert, startet und sogar einzelne Funktionen innerhalb des Programms sehen und testen.
15.**Hack:** 
*Standard*: Du musst dich zu 100 % an alle Regeln halten (keine Dateien > 150 Zeilen, keine leeren Funktionen, kein Hardcode, keine Mocks).
*Die Selbst-Anzeige*: Falls du aus irgendeinem Grund (sei es Zeitdruck, technische Blockade ODER weil du eine Regel wie die Dateilänge/Hardcodes im aktuellen Schritt verletzt hast) vom sauberen Standard abweichst, BIST DU VERPFLICHTET, DIE STELLE SOFORT MIT // HACK!!! [Welche Regel wurde verletzt und warum] ZU MARKIEREN.
*Wichtig* Das lautlose Verstoßen gegen Regeln ist der absolut größte Fehler. Ein Regelverstoß ohne HACK!!!-Markierung gilt als Systemversagen. Wenn du regelwidrig codest, MUSST du dich im Code und im Chat selbst anzeigen!
16.**Output:** Frage dich am Ende selber:
- Hast du dich strikt an unsere Regeln gehalten?
- Hast du alles modular gebaut?
- Hast du auf Linux geachtet?
- In welchen Punkten warst du faul, hast du am Ende rübergeguckt und es verbessert?
- Welche Dateien hast du gestichprobet?
- Gibt es wirklich keine keine Hardcodes mehr und das Sprachsystem ist vollmodular?
Antworte mir ehrlich und selbstkritisch. Wenn du noch alte/unbenutzte Dateien findest (Regel 10) oder noch hartcodierten Text in der UI entdeckst, liste mir die genauen Dateinamen und Zeilen auf und korrigiere sie sofort!
17.**Die "Zero-Pfuscher-Garantie"** (Strict Code Standards)
Erste Wahl ist IMMER die saubere Architektur: Bevor du Code schreibst, plane die beste, modularste Lösung. Nimm NIEMALS aus Zeit- oder Aufwandsersparnis den zweitbesten Weg.
Keine "Stillen Kompromisse": Du darfst Unsauberkeiten (Hardcodes, Fallback-Hacks, lange Dateien, leere Async-Funktionen) unter keinen Umständen stumm einbauen.
Die Pflicht zur Markierung (HACK!!!): Wenn eine saubere Lösung aus exogenen Gründen (z.B. OS-Bugs, externe API-Limits) technisch unmöglich ist, MUSST du:
Die Stelle im Code mit // HACK!!! [Detaillierte Begründung] markieren.
Mich in deiner finalen Antwort im Chat aktiv darauf hinweisen und erklären, warum es nicht anders ging.
Selbst-Audit vor Abgabe: Gehe vor JEDER Antwort gedanklich deine Änderungen durch. Wenn du auch nur einen temporären Trick findest, korrigiere ihn SELBSTSTÄNDIG, bevor du mir den Code gibst.


Selbst-Audit
Regel	Status	Details
1. Modularität	✅	3 kleine, spezialisierte Dateien
2. < 150 Zeilen	✅	config: 143, logger: 89, mod: 17
3. Async-Feedback	⏳	Kommt mit checker/downloader
4. Tech-Stack	✅	Tauri v2, Rust
5. English-Kommentare	✅	Oben in jeder Datei
6. App-Info	✅	Nicht geändert
7. Modularer Aufbau	✅	Jede Datei hat eine Aufgabe
8. Multi-Plattform	✅	Win/Linux/macOS in config
9. Keine gebündelten .exe	✅	Live-Download-System
10. Alte Dateien	⏳	commands/deps/ bleibt bis Migration fertig
11. Keine Abkürzungen	✅	Keine TODOs, keine leeren Funktionen
12. Sprachsystem	✅	Backend-Logs auf Englisch (Standard), Frontend-Übersetzungen unberührt
14. Testen	✅	cargo check bestanden
15. HACK!!!-Markierung	✅	Keine Verstöße