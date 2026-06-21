import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..'); 
const stageDir = path.join(__dirname, 'backend'); 

// 1. Alten Ordner sauber löschen und neu erstellen
if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

const filesToCopy = ['app.js', 'config.json', 'core.js', 'frontend.js', 'package.json', 'package-lock.json', 'node.exe'];
const foldersToCopy = ['core', '.cache', 'modules', 'plugins'];

// 2. Dateien kopieren
filesToCopy.forEach(file => {
    const from = path.join(srcDir, file);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, path.join(stageDir, file));
    }
});

// 3. Ordner kopieren
foldersToCopy.forEach(folder => {
    const from = path.join(srcDir, folder);
    if (fs.existsSync(from)) {
        fs.cpSync(from, path.join(stageDir, folder), { recursive: true, force: true });
    }
});

console.log('⚡ [Elysium] Backend staging area successfully prepared!');