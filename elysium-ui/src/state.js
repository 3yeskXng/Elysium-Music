export const state = {
    currentTrack: "Kein Track geladen",
    duration: 0,
    currentSeconds: 0,
    status: "standby",
    isPlaying: false
};

// Wir exportieren eine leere Funktion, damit main.js beim Aufruf nicht abstürzt
export function updateDOM() {
    // Wird von main.js aufgerufen, macht aber nichts, 
    // da main.js das HTML jetzt direkt selbst steuert.
}