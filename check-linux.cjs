const fs = require('fs');
const path = require('path');

console.log("========================================");
console.log("   ELYSIUM LINUX-READINESS CHECKER      ");
console.log("========================================\n");

let errors = 0;
let warnings = 0;

// Hilfsfunktion, um die tauri.conf.json irgendwo im Projekt zu finden
function findTauriConfig(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'target' || file === 'dist') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findTauriConfig(fullPath);
            if (found) return found;
        } else if (file === 'tauri.conf.json') {
            return fullPath;
        }
    }
    return null;
}

console.log("--- 0. Projektstruktur analysieren ---");
const mainConfigFullPath = findTauriConfig('.');

if (!mainConfigFullPath) {
    console.log("[✗] KRITISCHER FEHLER: 'tauri.conf.json' wurde nirgendwo im Projekt gefunden!");
    console.log("    Bist du sicher, dass du im richtigen Hauptordner (Elysium-Music) bist?");
    process.exit(1);
}

// Pfade dynamisch auflösen basierend auf dem Fundort der tauri.conf.json
const srcTauriDir = path.dirname(mainConfigFullPath); // z.B. elysium-ui/src-tauri
const backendDir = path.resolve(srcTauriDir, '..', 'backend'); // Nutzt das "../backend" aus deiner Config

console.log(`[✓] Tauri-Ordner lokalisiert unter:  ${srcTauriDir}`);
console.log(`[✓] Backend-Ordner lokalisiert unter: ${backendDir}\n`);

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`[✓] GEFUNDEN: ${description} (${filePath})`);
        return true;
    } else {
        console.log(`[✗] FEHLT:    ${description} !!!`);
        console.log(`    -> Erwarteter Pfad: ${filePath}`);
        errors++;
        return false;
    }
}

// 1. Check Binaries & Backend Files
console.log("--- 1. Backend & Binaries checken ---");
checkFile(path.join(backendDir, 'app.js'), "Backend-Hauptdatei");
checkFile(path.join(backendDir, 'node.exe'), "Windows Node-Binary");
const hasLinuxNode = checkFile(path.join(backendDir, 'node'), "Linux Node-Binary (ohne Dateiendung)");

if (hasLinuxNode) {
    const stats = fs.statSync(path.join(backendDir, 'node'));
    if (stats.size < 10 * 1024 * 1024) {
        console.log(`[!] WARNUNG: Die Linux-'node'-Datei ist verdächtig klein (${(stats.size / 1024 / 1024).toFixed(2)} MB). Sicher, dass es das echte Binary aus /bin/ ist?`);
        warnings++;
    }
}
console.log("");

// 2. Check Tauri Configs
console.log("--- 2. Tauri-Konfigurationen checken ---");
const linuxConfigPath = path.join(srcTauriDir, 'tauri.linux.conf.json');
const winConfigPath = path.join(srcTauriDir, 'tauri.windows.conf.json');

try {
    const config = JSON.parse(fs.readFileSync(mainConfigFullPath, 'utf8'));
    if (config.bundle && config.bundle.resources) {
        console.log("[✗] FEHLER: 'bundle.resources' existiert noch in tauri.conf.json!");
        console.log("    -> Das wird dazu führen, dass Linux fälschlicherweise die node.exe einpackt. Bitte dort löschen.");
        errors++;
    } else {
        console.log("[✓] SAUBER: Hauptkonfiguration enthält keine festen Ressourcen.");
    }
} catch (e) {
    console.log("[✗] FEHLER: tauri.conf.json konnte nicht als JSON gelesen werden (Syntaxfehler!).");
    errors++;
}

if (checkFile(linuxConfigPath, "Linux-Spezifische Konfiguration")) {
    try {
        const config = JSON.parse(fs.readFileSync(linuxConfigPath, 'utf8'));
        const res = config.bundle && config.bundle.resources ? config.bundle.resources : [];
        if (res.includes("../backend/node.exe")) {
            console.log("[✗] FEHLER: In tauri.linux.conf.json ist fälschlicherweise 'node.exe' eingetragen!");
            errors++;
        }
        if (!res.includes("../backend/node")) {
            console.log("[✗] FEHLER: In tauri.linux.conf.json fehlt der Eintrag für das Linux-Binary '../backend/node'!");
            errors++;
        }
    } catch (e) {
        console.log("[✗] FEHLER: tauri.linux.conf.json Syntaxfehler.");
        errors++;
    }
}

checkFile(winConfigPath, "Windows-Spezifische Konfiguration");
console.log("");

// 3. Check Rust Code
console.log("--- 3. Rust-Quellcode checken ---");
const libRsPath = path.join(srcTauriDir, 'src', 'lib.rs');
if (checkFile(libRsPath, "Rust-Bibliothek (lib.rs)")) {
    const content = fs.readFileSync(libRsPath, 'utf8');
    
    if (!content.includes("cfg!(windows)")) {
        console.log("[✗] FEHLER: In lib.rs fehlt die dynamische Unterscheidung für Windows/Linux (cfg!(windows)).");
        errors++;
    } else {
        console.log("[✓] SAUBER: Rust-Code unterscheidet dynamisch zwischen den Plattformen.");
    }

    if (content.includes("std::os::unix::fs::PermissionsExt") || content.includes("0o755")) {
        console.log("[✓] SAUBER: Linux-Rechtevergabe (+x CHMOD) ist im Rust-Code eingebaut.");
    } else {
        console.log("[✗] FEHLER: Kein CHMOD-Code für Linux in lib.rs gefunden! Das Linux-Node-Binary wird nicht starten dürfen.");
        errors++;
    }
}
console.log("");

// 4. Check GitHub Actions Workflow
console.log("--- 4. GitHub Release-Workflow checken ---");
const workflowPath = path.join('.github', 'workflows', 'release.yml');
if (fs.existsSync(workflowPath)) {
    console.log(`[✓] GEFUNDEN: GitHub Workflow (${workflowPath})`);
    const content = fs.readFileSync(workflowPath, 'utf8');
    if (content.includes("tauri-apps/tauri-action@v2")) {
        console.log("[✗] FEHLER: In release.yml steht noch 'tauri-action@v2'. Das muss zu '@v0' geändert werden.");
        errors++;
    } else if (content.includes("tauri-apps/tauri-action@v0")) {
        console.log("[✓] SAUBER: release.yml nutzt die korrekte tauri-action Version (@v0).");
    }
} else {
    console.log("[!] HINWEIS: Keine release.yml im Hauptverzeichnis gefunden.");
    warnings++;
}
console.log("");

// Final Verdict
console.log("========================================");
console.log("               ERGEBNIS                 ");
console.log("========================================");
if (errors === 0 && warnings === 0) {
    console.log("🎉 PERFEKT! Alles ist bereit für den Linux-Build. Du kannst den Tag pushen!");
} else if (errors === 0 && warnings > 0) {
    console.log(`⚠️ STARTBEREIT MIT WARNUNGEN (${warnings} Warnung(en)). Es sollte klappen, schau dir die Warnungen an.`);
} else {
    console.log(`🛑 BLOCKIERT: Es wurden ${errors} kritische Fehler und ${warnings} Warnungen gefunden.`);
    console.log("   Bitte korrigiere die [✗]-Punkte, bevor du weitermachst.");
}
console.log("========================================");