// modules/queue.js

class QueueService {
    constructor() {
        this.tracks = [];
    }

    /**
     * Adds a track query to the end of the queue
     * @param {string} trackQuery 
     */
    enqueue(trackQuery) {
        this.tracks.push(trackQuery);
        console.log(`[Queue] Added to queue: "${trackQuery}" (Position: ${this.tracks.length})`);
    }

    /**
     * Removes and returns the next track in line
     * @returns {string|null}
     */
    dequeue() {
        if (this.tracks.length === 0) return null;
        return this.tracks.shift(); // Takes the first element out
    }

    /**
     * Returns the current state of the queue
     * @returns {Array}
     */
    getTracks() {
        return this.tracks;
    }

    /**
     * Clears all tracks from the queue
     */
    clear() {
        this.tracks = [];
        console.log("[Queue] Queue cleared.");
    }
}

// Export a single instance to be shared across the system
module.exports = new QueueService();