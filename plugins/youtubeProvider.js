import play from 'play-dl';
import youtubedl from 'youtube-dl-exec';
import https from 'https';

export const YoutubeProvider = {
    name: 'YouTube Streaming',

    async getStream(trackName, writeToLogFile) {
        writeToLogFile('YT_HYBRID', 'Starte Hybrid-Engine', `Suchbegriff: ${trackName}`);
        
        let videoInfo;
        let finalTitle = trackName;
        let finalDuration = 180;

        // ==========================================
        // 1. & 2. KUGELSICHERE HYBRID-SUCHE & ENTSCHLÜSSELUNG
        // ==========================================
        try {
            writeToLogFile('YT_SEARCH_START', 'Versuche blitzschnelle Suche via play-dl...');
            const searchResults = await play.search(trackName, { limit: 1 });
            const video = searchResults?.[0];
            
            if (!video) {
                writeToLogFile('YT_SEARCH_EMPTY', 'Keine YouTube-Treffer via play-dl', { trackName });
                return null;
            }

            finalTitle = video.title;
            finalDuration = video.durationInSec || 180;
            writeToLogFile('YT_SEARCH_SUCCESS', 'Video über play-dl gefunden, starte yt-dlp Entschlüsselung...', { url: video.url });

            // Normaler Ablauf mit der gefundenen URL
            videoInfo = await youtubedl(video.url, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true
            });

        } catch (error) {
            // HIER WIRD DEIN CRASH GEFANGEN! (Der browseId-Fehler von play-dl)
            writeToLogFile('YT_PATCH_ACTIVATED', 'play-dl wegen YouTube-Layout abgestürzt. Aktiviere yt-dlp-Fallback-Suche...', error.message);
            
            try {
                // yt-dlp sucht UND entschlüsselt direkt in einem Schritt via "ytsearch1:"
                const rawSearchInfo = await youtubedl(`ytsearch1:${trackName}`, {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true
                });

                // Bei ytsearch1 liefert yt-dlp ein Objekt mit einem 'entries'-Array zurück
                if (rawSearchInfo && rawSearchInfo.entries && rawSearchInfo.entries[0]) {
                    videoInfo = rawSearchInfo.entries[0];
                    finalTitle = videoInfo.title;
                    finalDuration = videoInfo.duration || 180;
                    writeToLogFile('YT_FALLBACK_SUCCESS', 'Song erfolgreich über yt-dlp Fallback gefunden!', { titel: finalTitle });
                }
            } catch (fallbackError) {
                writeToLogFile('YT_TOTAL_CRASH', 'Auch der yt-dlp Fallback ist fehlgeschlagen', fallbackError.message);
                throw fallbackError;
            }
        }

        if (!videoInfo || !videoInfo.formats) {
            const err = new Error("yt-dlp hat keine Format-Metadaten zurückgegeben.");
            writeToLogFile('YT_YTDLP_EMPTY', 'Keine Formate extrahiert', err.message);
            throw err;
        }

        // ==========================================
        // 3. SELEKTION DES OPTIMALEN OPUS-AUDIOSTREAMS
        // ==========================================
        const audioFormats = videoInfo.formats.filter(f => f.vcodec === 'none' && f.url);
        
        if (audioFormats.length === 0) {
            const err = new Error("Keine reinen Audio-Spuren in den yt-dlp-Metadaten gefunden.");
            writeToLogFile('YT_AUDIO_EMPTY', 'Filter fehlgeschlagen', err.message);
            throw err;
        }

        // Suche gezielt nach dem hervorragenden Opus-Codec, sonst nimm die beste Alternative (AAC)
        const bestAudio = audioFormats.find(f => f.acodec?.toLowerCase().includes('opus')) || audioFormats[0];

        writeToLogFile('YT_STREAM_SELECTED', 'Optimalen Audiostream isoliert', {
            format_id: bestAudio.format_id,
            codec: bestAudio.acodec,
            container: bestAudio.ext,
            url_auszug: bestAudio.url.substring(0, 80) + '...'
        });

        // ==========================================
        // 4. DIREKTEN HTTPS STREAM ERZEUGEN
        // ==========================================
        writeToLogFile('YT_HTTPS_STREAM', 'Injiziere direkten HTTPS-Stream zur GoogleVideo-Quelle');
        
        const requestOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        };

        const rawHttpsStream = await new Promise((resolve, reject) => {
            https.get(bestAudio.url, requestOptions, (response) => {
                if (response.statusCode >= 400) {
                    reject(new Error(`YouTube verweigert HTTPS-Streaming: Status ${response.statusCode}`));
                } else {
                    resolve(response);
                }
            }).on('error', (err) => reject(err));
        });

        writeToLogFile('YT_SUCCESS', 'Hybrid-Engine hat den Stream erfolgreich bereitgestellt!');

        return {
            type: 'network_stream',
            stream: rawHttpsStream,
            contentType: bestAudio.ext === 'webm' ? 'audio/webm' : 'audio/mp4',
            title: finalTitle,
            duration: finalDuration
        };
    }
};