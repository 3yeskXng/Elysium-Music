import play from 'play-dl';
import youtubedl from 'youtube-dl-exec';
import https from 'https';

export const YoutubeProvider = {
    name: 'YouTube Streaming',

    async getStream(trackName, writeToLogFile) {
        writeToLogFile('YT_HYBRID', 'Starte Hybrid-Engine', `Suchbegriff: ${trackName}`);
        
        // ==========================================
        // 1. BLITZSCHNELLE SUCHE VIA PLAY-DL
        // ==========================================
        let searchResults;
        try {
            searchResults = await play.search(trackName, { limit: 1 });
        } catch (searchError) {
            writeToLogFile('YT_SEARCH_CRASH', 'Fehler bei der play-dl Suche', searchError.message);
            throw searchError;
        }

        const video = searchResults?.[0];
        if (!video) {
            writeToLogFile('YT_SEARCH_EMPTY', 'Keine YouTube-Treffer für diesen Begriff', { trackName });
            return null;
        }

        writeToLogFile('YT_SEARCH_SUCCESS', 'Video erfolgreich über play-dl gefunden', {
            titel: video.title,
            url: video.url
        });

        // ==========================================
        // 2. KUGELSICHERE ENTSCHLÜSSELUNG VIA YT-DLP
        // ==========================================
        writeToLogFile('YT_YTDLP_START', 'Rufe decodierte Streaming-URLs ab via yt-dlp...');
        
        let videoInfo;
        try {
            videoInfo = await youtubedl(video.url, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true
            });
        } catch (ytdlpError) {
            writeToLogFile('YT_YTDLP_CRASH', 'yt-dlp Entschlüsselung fehlgeschlagen', ytdlpError.message);
            throw ytdlpError;
        }

        if (!videoInfo || !videoInfo.formats) {
            const err = new Error("yt-dlp hat keine Format-Metadaten zurückgegeben.");
            writeToLogFile('YT_YTDLP_EMPTY', 'Keine Formate extrahiert', err.message);
            throw err;
        }

        // ==========================================
        // 3. SELEKTION DES OPTIMALEN OPUS-AUDIOSTREAMS
        // ==========================================
        // vcodec === 'none' garantiert reine Audio-Streams ohne hungrige Videodaten
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
            title: video.title,
            duration: video.durationInSec || videoInfo.duration || 180
        };
    }
};