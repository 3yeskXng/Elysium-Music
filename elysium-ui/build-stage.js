import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild'; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..'); 
const stageDir = path.join(__dirname, 'backend'); 

console.log('⚡ [Elysium] Starting ultimate backend staging process...');

// 1. Clean and recreate the destination directory
if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// 🔥 DYNAMISCHER plattformspezifischer Node-Check
const nodeBinary = process.platform === 'win32' ? 'node.exe' : 'node';

// Added 'i18n.js' to the copy list to ensure localization files are shipped
// 'nodeBinary' ersetzt jetzt das hartcodierte 'node.exe'
const filesToCopy = ['config.json', 'core.js', 'frontend.js', 'i18n.js', 'package.json', 'package-lock.json', nodeBinary];
const foldersToCopy = ['core', '.cache', 'modules', 'plugins'];

// 2. Copy individual configuration and binary files
filesToCopy.forEach(file => {
    const from = path.join(srcDir, file);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, path.join(stageDir, file));
    }
});

// [Der Rest deines Skripts für Ordner, YouTube-DL und esbuild bleibt exakt gleich...]

// 3. Copy required dependency directories
foldersToCopy.forEach(folder => {
    const from = path.join(srcDir, folder);
    if (fs.existsSync(from)) {
        fs.cpSync(from, path.join(stageDir, folder), { recursive: true, force: true });
    }
});

// Locate and migrate YouTube-DL/YT-DLP binaries into the installer scope
const ytdlBinSrc = path.join(srcDir, 'node_modules', 'youtube-dl-exec', 'bin');
const ytdlBinDest = path.join(stageDir, 'bin');
if (fs.existsSync(ytdlBinSrc)) {
    console.log('📦 Moving YouTube-DL binaries into staging area...');
    fs.cpSync(ytdlBinSrc, ytdlBinDest, { recursive: true, force: true });
}

// 4. Compile backend and resolve all module scope discrepancies
console.log('🚀 Bundling backend codebase and resolving dependency scopes...');
try {
    esbuild.buildSync({
        entryPoints: [path.join(srcDir, 'app.js')],
        bundle: true,
        platform: 'node',
        target: 'node26', 
        format: 'esm',    
        outfile: path.join(stageDir, 'app.js'), 
        minify: false,    
        sourcemap: false,
        external: ['play-opus', 'opusscript'], 
        // Changed from 'const' to 'var' to allow harmless re-declarations down the line inside the flattened bundle file
        banner: {
            js: `import { createRequire as __esbuild_localCreateRequire } from 'module';
var require = __esbuild_localCreateRequire(import.meta.url);
var __filename = require('url').fileURLToPath(import.meta.url);
var __dirname = require('path').dirname(__filename);
process.env.YOUTUBE_DL_DIR = require('path').join(__dirname, 'bin');`,
        },
    });
    console.log('✅ [Elysium] Staging and bundling successfully completed with zero conflicts!');
} catch (err) {
    console.error('❌ Critical error encountered during esbuild compilation:', err);
    process.exit(1);
}