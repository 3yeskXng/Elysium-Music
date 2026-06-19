// app.js
const readline = require('readline');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const core = require('./core.js');
const i18n = core._getPlugin('i18n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ELYSIUM> '
});

let hasActiveProgressLine = false;
let windowsMediaProcess = null;

console.log(i18n.t('welcome'));

// --- UNSICHTBARE & ZUVERLÄSSIGE MEDIENTASTEN-BRÜCKE ---
function initWindowsMediaKeys() {
    if (process.platform !== 'win32') return;

    const cacheDir = path.resolve('./.cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const csPath = path.join(cacheDir, 'MediaKeyHelper.cs');
    const exePath = path.join(cacheDir, 'MediaKeyHelper.exe');

    // Altes, fehlerhaftes Fenster rigoros beenden und löschen
    try { execSync('taskkill /F /IM MediaKeyHelper.exe', { stdio: 'ignore' }); } catch(e) {}
    try { if (fs.existsSync(exePath)) fs.unlinkSync(exePath); } catch(e) {}

    // Reiner C#-Code OHNE Fenster (Kein Form!). Nutzt einen systemweiten Hook.
    const csCode = `
using System;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Windows.Forms;

class MediaKeyHelper {
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;
    private const int VK_MEDIA_PLAY_PAUSE = 0xCD; // Physische Play/Pause Taste

    private static LowLevelKeyboardProc _proc = HookCallback;
    private static IntPtr _hookID = IntPtr.Zero;

    public static void Main() {
        _hookID = SetHook(_proc);
        Application.Run(); // Startet einen reinen Hintergrund-Thread ohne Fenster!
        UnhookWindowsHookEx(_hookID);
    }

    private static IntPtr SetHook(LowLevelKeyboardProc proc) {
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule) {
            return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
    }

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN)) {
            int vkCode = Marshal.ReadInt32(lParam);
            if (vkCode == VK_MEDIA_PLAY_PAUSE) {
                Console.WriteLine("TOGGLE"); // Signal an Node.js senden
            }
        }
        return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);
}
`;

    fs.writeFileSync(csPath, csCode.trim());
    
    let csc = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
    if (!fs.existsSync(csc)) {
        csc = 'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe';
    }

    if (fs.existsSync(csc)) {
        try {
            // Als Hintergrund-Anwendung (/target:winexe) kompilieren -> 100% unsichtbar
            execSync(`"${csc}" /target:winexe /out:"${exePath}" "${csPath}"`, { stdio: 'ignore' });
        } catch (e) {
            return;
        }
    }

    if (fs.existsSync(exePath)) {
        windowsMediaProcess = spawn(exePath);
        windowsMediaProcess.stdout.on('data', (data) => {
            if (data.toString().trim() === "TOGGLE") {
                const player = core._getPlugin('player');
                const success = player.togglePause();
                if (success) {
                    printSystemLog(player.isPaused ? "[Taste] ⏸️ Wiedergabe pausiert." : "[Taste] ▶️ Wiedergabe fortgesetzt.");
                }
            }
        });
    }
}

initWindowsMediaKeys();
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
    const player = core._getPlugin('player');
    const barWidth = 20;
    const filledWidth = Math.round((data.percentage / 100) * barWidth);
    const emptyWidth = Math.max(0, barWidth - filledWidth);
    const barStr = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

    let progressMsg = i18n.t('progress_bar')
        .replace('%PERCENT%', data.percentage)
        .replace('%BAR%', barStr)
        .replace('%CURRENT%', data.currentFormatted)
        .replace('%TOTAL%', data.totalFormatted);

    if (player.isPaused) {
        progressMsg = `⏸️  [PAUSIERT] ` + progressMsg;
    } else {
        progressMsg = `▶️  ` + progressMsg;
    }

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
    hasActiveProgressLine = false;

    const input = line.trim();
    const spaceIndex = input.indexOf(' ');
    const command = spaceIndex !== -1 ? input.substring(0, spaceIndex).toLowerCase() : input.toLowerCase();
    const args = spaceIndex !== -1 ? input.substring(spaceIndex + 1) : '';

    switch (command) {
        case 'exit':
            console.log(i18n.t('shutdown'));
            if (windowsMediaProcess) windowsMediaProcess.kill();
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

        case 'pause':
        case 'resume':
            const player = core._getPlugin('player');
            const success = player.togglePause();
            if (success) {
                printSystemLog(player.isPaused ? "[Elysium] Pausiert. Drücke deine Mediataste zum Fortsetzen." : "[Elysium] Setze Wiedergabe fort...");
            } else {
                printSystemLog("[Elysium] Aktuell läuft keine Musik.");
            }
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
    if (windowsMediaProcess) windowsMediaProcess.kill();
    core.stopAll();
    process.exit(0);
});