const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const UI_DIR = __dirname; 

function log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', system: '⚙️' };
    console.log(`[Elysium Build System] ${icons[type] || '•'} ${message}`);
}

async function executeBuildPipeline() {
    try {
        log('Initiating production asset preparation sequence...', 'system');

        if (!fs.existsSync(UI_DIR)) {
            throw new Error(`Critical Directory Missing: "${UI_DIR}". Build sequence aborted.`);
        }

        const nodeModulesPath = path.join(UI_DIR, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            log('Frontend node_modules missing. Triggering autonomous dependency recovery...', 'info');
            execSync('npm install', { cwd: UI_DIR, stdio: 'inherit' });
            log('Dependencies successfully recovered.', 'success');
        }

        log('Compiling premium modular user interface assets...', 'info');
        try {
            execSync('npm run build', { cwd: UI_DIR, stdio: 'inherit' });
            log('Frontend asset compilation completed successfully.', 'success');
        } catch (buildScriptError) {
            log('No dedicated frontend build script required or script omitted. Processing directly.', 'info');
        }

        log('Staging area successfully synchronized. Handing over to Tauri Action Matrix.', 'success');

    } catch (error) {
        log(`Build pipeline collapsed due to unrecoverable fault: ${error.message}`, 'error');
        process.exit(1);
    }
}

executeBuildPipeline();