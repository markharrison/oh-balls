// AudioHandler: abstraction layer between game and audio library
import { AudioMark } from '../lib/audiomark.js';

export class AudioHandler {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.configManager = this.objectManager.get('ConfigManager');
        this.audioMark = this.objectManager.register('AudioMark', new AudioMark());
        this.audioEnabled = this.configManager.audioEnabled;
        this.musicPlaying = false;
    }

    doToast(vText1, vText2 = '') {
        if (!this.sceneManager) {
            this.sceneManager = this.objectManager.get('SceneManager');
        }

        this.sceneManager.doToast(vText1, vText2);
    }

    async loadAudioFiles() {
        await this.audioMark.initialize();

        await this.audioMark.loadAudio('MenuMusic', 'audio/calm-background-pixabay.mp3');

        await this.audioMark.loadAudio('GameMusic', 'audio/BounceXJimHall.mp3');

        await this.audioMark.loadAudio('Combine1', 'audio/combine1-pixabay.mp3');
        await this.audioMark.loadAudio('Combine2', 'audio/combine2-pixabay.mp3');
        await this.audioMark.loadAudio('Combine3', 'audio/combine3-pixabay.mp3');
        await this.audioMark.loadAudio('Combine4', 'audio/combine4-pixabay.mp3');
        await this.audioMark.loadAudio('Combine5', 'audio/combine5-pixabay.mp3');
        await this.audioMark.loadAudio('Combine6', 'audio/combine6-pixabay.mp3');
        await this.audioMark.loadAudio('Beep', 'audio/bleep-pixabay.mp3');
        await this.audioMark.loadAudio('GameOver', 'audio/endgame-pixabay.mp3');
    }

    initialize() {
        this.doToast('Initialize audio ...');

        this.loadAudioFiles();

        this.doToast('Initialize audio completed ...');
    }

    playSFX(sound) {
        if (this.audioEnabled) {
            this.audioMark.playSFX(sound);
        }
    }

    playMusic(track) {
        if (this.audioEnabled) {
            this.audioMark.playMusic(track, { loop: true });
            this.musicPlaying = true;
        }
    }

    transitionMusic(track) {
        if (this.audioEnabled) {
            this.audioMark.transitionMusic(track, 4, { loop: true });
        }
    }

    stopAll() {
        this.audioMark.stopAll();
        this.musicPlaying = false;
    }

    stopMusic() {
        this.audioMark.stopMusic();
        this.musicPlaying = false;
    }

    setVolume() {
        this.audioMark.setVolume('master', this.configManager.masterVolume);
        this.audioMark.setVolume('music', this.configManager.musicVolume);
        this.audioMark.setVolume('sfx', this.configManager.sfxVolume);
    }

    updateAudioNewSettings() {
        this.setVolume();
        this.audioEnabled = this.configManager.audioEnabled;
        if (!this.audioEnabled) {
            this.stopAll();
        } else {
            if (!this.musicPlaying) {
                this.playMusic('MenuMusic');
            }
        }
    }
}
