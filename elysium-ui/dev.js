import { spawn, execSync } from 'child_process';

console.log('\x1b[36m%s\x1b[0m', '🔄 [Elysium Launcher] Spiegele modulare Ordnerstruktur...');
try {
    execSync('node build-stage.js', { stdio: 'inherit' });
} catch (err) {
    console.error('❌ Staging fehlgeschlagen:', err);
}

console.log('\n🚀 [Elysium Launcher] Starte Core-Engine & Tauri-UI parallel...\n');

// 1. Starte die app.js (Core) – wir fangen den Output ab
const coreProcess = spawn('node', ['../app.js'], { shell: true });

coreProcess.stdout.on('data', (data) => {
    // Gibt dem Core-Log ein grünes [CORE] Prefix
    process.stdout.write(`\x1b[32m[CORE]\x1b[0m ${data}`);
});

coreProcess.stderr.on('data', (data) => {
    process.stderr.write(`\x1b[31m[CORE-ERROR]\x1b[0m ${data}`);
});

// 2. Starte Tauri Dev – wir fangen den Output ab
const tauriProcess = spawn('npx', ['tauri', 'dev'], { shell: true });

tauriProcess.stdout.on('data', (data) => {
    // Gibt dem Tauri-Log ein blaues [TAURI] Prefix
    process.stdout.write(`\x1b[34m[TAURI]\x1b[0m ${data}`);
});

tauriProcess.stderr.on('data', (data) => {
    process.stderr.write(`\x1b[31m[TAURI-ERROR]\x1b[0m ${data}`);
});

// Sauberer Exit bei STRG+C
process.on('SIGINT', () => {
    console.log('\n🛑 [Elysium Launcher] Fahre alle Prozesse herunter...');
    coreProcess.kill();
    tauriProcess.kill();
    process.exit();
});