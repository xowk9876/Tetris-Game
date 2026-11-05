// Media elements stream independently of the Phaser scene and never delay its first frame.
const files = { bgm: 'bgm.mp3', drop: 'drop.wav', game_over: 'game_over.wav', tetris: 'tetris.wav' };

export class GameAudio {
    constructor(createElement = () => new Audio()) {
        this.createElement = createElement;
        this.tracks = new Map();
    }

    getTrack(key) {
        if (!this.tracks.has(key)) {
            const media = this.createElement();
            media.preload = 'none';
            media.loop = key === 'bgm';
            media.src = '/sounds/' + files[key];
            this.tracks.set(key, media);
        }
        return this.tracks.get(key);
    }

    syncMusic(playing) {
        if (!playing) {
            this.tracks.get('bgm')?.pause();
            return;
        }
        const music = this.getTrack('bgm');
        if (music.paused) {
            music.volume = 0.3;
            // Browsers can deny autoplay. The next game input retries within a user gesture.
            music.play().catch(() => {});
        }
    }

    playEffect(key, volume) {
        const effect = this.getTrack(key);
        effect.volume = volume;
        effect.currentTime = 0;
        effect.play().catch(() => {});
    }

    pauseAll() {
        for (const track of this.tracks.values()) track.pause();
    }

    destroy() {
        for (const track of this.tracks.values()) {
            track.pause();
            track.removeAttribute('src');
            track.load();
        }
        this.tracks.clear();
    }
}
