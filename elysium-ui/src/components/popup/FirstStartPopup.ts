// elysium-ui/src/components/popup/FirstStartPopup.ts
// First-start overlay — shows download progress for missing dependencies
// Auto-closes when all tools are ready. Uses existing dep-progress Tauri events.

import { t } from '../../utils/translate.js';

function log(level: string, msg: string) {
  if ((window as any).triggerElysiumLog) (window as any).triggerElysiumLog(level, 'FirstStart', msg);
}

let overlay: HTMLDivElement | null = null;
let statusEl: HTMLDivElement | null = null;
let progressBar: HTMLDivElement | null = null;
let progressFill: HTMLDivElement | null = null;
let unlistenFn: (() => void) | null = null;

function createOverlay(): HTMLDivElement {
  overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:10000;
    display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);
    font-family:system-ui, sans-serif;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background:var(--bg-main, #1a1a2e); border:1px solid var(--border-subtle, #333);
    border-radius:12px; padding:40px; max-width:420px; width:90%; text-align:center;
  `;

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size:2rem; margin-bottom:16px;';
  icon.textContent = '🎵';

  const title = document.createElement('h2');
  title.style.cssText = 'color:var(--text-main, #fff); font-size:1.2rem; margin:0 0 8px 0;';
  title.textContent = t('firststart_title');

  const subtitle = document.createElement('p');
  subtitle.style.cssText = 'color:var(--text-muted, #999); font-size:0.9rem; margin:0 0 24px 0;';
  subtitle.textContent = t('firststart_subtitle');

  progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width:100%; height:6px; background:rgba(255,255,255,0.1);
    border-radius:3px; overflow:hidden; margin-bottom:16px;
  `;

  progressFill = document.createElement('div');
  progressFill.style.cssText = `
    width:0%; height:100%; background:var(--accent-premium, #8a5cf6);
    border-radius:3px; transition:width 0.3s ease;
  `;
  progressBar.appendChild(progressFill);

  statusEl = document.createElement('div');
  statusEl.style.cssText = 'color:var(--accent-premium, #8a5cf6); font-size:0.85rem; min-height:20px;';
  statusEl.textContent = t('firststart_checking');

  card.append(icon, title, subtitle, progressBar, statusEl);
  overlay.appendChild(card);
  return overlay;
}

function updateProgress(percent: number, text: string) {
  if (progressFill) progressFill.style.width = `${Math.min(percent, 100)}%`;
  if (statusEl) statusEl.textContent = text;
}

function closeOverlay() {
  if (unlistenFn) { unlistenFn(); unlistenFn = null; }
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s ease';
    setTimeout(() => { overlay?.remove(); overlay = null; }, 400);
  }
}

export async function initFirstStartPopup() {
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    const listen = internals?.event?.listen;
    if (typeof listen !== 'function') return;

    const { invoke } = internals;
    const status = await invoke('check_all_deps');
    const allReady = status.ytdlp && status.ffmpeg && status.ffprobe;
    if (allReady) return;

    log('INFO', 'Missing deps detected, showing first-start popup');
    document.body.appendChild(createOverlay());

    unlistenFn = await listen('dep-progress', (event: any) => {
      const p = event.payload;
      if (p.progress >= 100 && p.tool === 'all') {
        updateProgress(100, t('firststart_ready'));
        setTimeout(closeOverlay, 1200);
        return;
      }
      if (p.progress >= 100) {
        updateProgress((p.progress / 3), `${p.tool} ✓`);
      } else {
        const pct = Math.min(p.progress, 99);
        updateProgress(pct, `${t('firststart_downloading')} ${p.tool}...`);
      }
    });
  } catch (err) {
    log('ERROR', `FirstStart check failed: ${err}`);
    closeOverlay();
  }
}
