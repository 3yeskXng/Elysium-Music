// app.js
const readline = require('readline');
const core = require('./core.js');
const i18n = core._getPlugin('i18n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ELYSIUM> '
});

console.log(i18n.t('welcome'));
rl.prompt();

// --- ATTACHING UI EVENT LISTENERS TO THE CORE ---
core.on('statusMessage', (msg) => { console.log(msg); rl.prompt(); });
core.on('trackStarted', (track) => { console.log(i18n.t('track_started') + `"${track}"`); rl.prompt(); });
core.on('trackSkipped', () => { console.log(i18n.t('skip_action')); rl.prompt(); });
core.on('queueConcluded', () => { console.log(i18n.t('queue_finished')); rl.prompt(); });
core.on('error', (err) => { console.error(`[Error] ${err}`); rl.prompt(); });

rl.on('line', (line) => {
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
            console.log(`${i18n.t('unknown_cmd')}"${command}"`);
            break;
    }
    rl.prompt();
});

process.on('SIGINT', () => {
    console.log(i18n.t('forced_shutdown'));
    core.stopAll();
    process.exit(0);
});