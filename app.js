// app.js
const readline = require('readline');
const core = require('./core.js');
const i18n = core._getPlugin('i18n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ELYSIUM> '
});

let hasActiveProgressLine = false;

console.log(i18n.t('welcome'));
rl.prompt();

function printSystemLog(msg) {
    if (hasActiveProgressLine) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        hasActiveProgressLine = false;
    }
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(msg);
    rl.prompt(true);
}

// --- ATTACHING UI EVENT LISTENERS TO THE CORE ---
core.on('statusMessage', (msg) => { printSystemLog(msg); });
core.on('trackStarted', (track) => { printSystemLog(i18n.t('track_started') + `"${track}"`); });
core.on('trackSkipped', () => { printSystemLog(i18n.t('skip_action')); });
core.on('queueConcluded', () => { 
    if (hasActiveProgressLine) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        hasActiveProgressLine = false;
    }
    printSystemLog(i18n.t('queue_finished')); 
});
core.on('error', (err) => { printSystemLog(`[Error] ${err}`); });

core.on('playbackProgress', (data) => {
    const barWidth = 20;
    const filledWidth = Math.round((data.percentage / 100) * barWidth);
    const emptyWidth = Math.max(0, barWidth - filledWidth);
    const barStr = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

    let progressMsg = i18n.t('progress_bar')
        .replace('%PERCENT%', data.percentage)
        .replace('%BAR%', barStr)
        .replace('%CURRENT%', data.currentFormatted)
        .replace('%TOTAL%', data.totalFormatted);

    if (hasActiveProgressLine) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
    }

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    
    process.stdout.write(progressMsg + '\n');
    
    readline.clearLine(process.stdout, 0);
    rl.prompt(true);
    hasActiveProgressLine = true;
});

rl.on('line', (line) => {
    // FIX: Just decouple the flag on enter, let native shell layout process the execution line
    hasActiveProgressLine = false;

    const input = line.trim();
    const spaceIndex = input.indexOf(' ');
    const command = spaceIndex !== -1 ? input.substring(0, spaceIndex).toLowerCase() : input.toLowerCase();
    const args = spaceIndex !== -1 ? input.substring(spaceIndex + 1) : '';

    switch (command) {
        case 'exit':
            console.log(i18n.t('shutdown'));
            core.stopAll();
            process.exit(0);
            break;

        case 'stop':
            console.log(i18n.t('stop_request'));
            core.stopAll();
            break;

        case 'next':
            console.log(i18n.t('skip_request'));
            core.skip();
            break;

        case 'play':
            if (!args) { console.log(i18n.t('err_no_song')); break; }
            core.stopAll();
            core.enqueue(args);
            break;

        case 'add':
            if (!args) { console.log(i18n.t('err_no_song_add')); break; }
            core.enqueue(args);
            break;

        case 'playlist':
            if (!args) { console.log(i18n.t('err_no_playlist')); break; }
            core.loadPlaylist(args);
            break;

        case 'queue':
            const list = core._getPlugin('queue').getTracks();
            if (list.length === 0) {
                console.log(i18n.t('queue_empty'));
            } else {
                console.log(i18n.t('queue_title'));
                list.forEach((track, index) => console.log(`${index + 1}. ${track}`));
                console.log(i18n.t('queue_footer'));
            }
            break;

        default:
            if (command !== '') {
                console.log(`${i18n.t('unknown_cmd')}"${command}"`);
            }
            break;
    }
    rl.prompt();
});

process.on('SIGINT', () => {
    console.log(i18n.t('forced_shutdown'));
    core.stopAll();
    process.exit(0);
});