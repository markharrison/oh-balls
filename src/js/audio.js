// AudioHandler: abstraction layer between game and audio library
import { MarkJSAudio } from '@markharrison/markjsaudio';

export class AudioHandler {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.configManager = this.objectManager.getById('ConfigManager');
    this.audioMark = this.objectManager.register('MarkJSAudio', new MarkJSAudio());
    this.audioEnabled = this.configManager.audioEnabled;
    this.musicPlaying = false;
    this._preloadPromise = null;
    this.audioPreloaded = false;
  }

  //     document.getElementById('start-audio').addEventListener('click', async () => {
  //   await audioHandler.waitForPreload();
  //   await audioHandler.initialize();
  // });

  doToast(vText1, vText2 = '', vType = 'info') {
    if (!this.sceneManager) {
      this.sceneManager = this.objectManager.getById('SceneManager');
    }

    this.sceneManager.doToast(vText1, vText2, vType);
  }

  async preloadAudio() {
    if (!this._preloadPromise) {
      const tasks = [
        this.audioMark.preloadAudio('MenuMusic', 'audio/calm-background-pixabay.mp3'),
        this.audioMark.preloadAudio('GameMusic', 'audio/BounceXJimHall.mp3'),
        this.audioMark.preloadAudio('Combine1', 'audio/combine1-pixabay.mp3'),
        this.audioMark.preloadAudio('Combine2', 'audio/combine2-pixabay.mp3'),
        this.audioMark.preloadAudio('Combine3', 'audio/combine3-pixabay.mp3'),
        this.audioMark.preloadAudio('Combine4', 'audio/combine4-pixabay.mp3'),
        this.audioMark.preloadAudio('Combine5', 'audio/combine5-pixabay.mp3'),
        this.audioMark.preloadAudio('Combine6', 'audio/combine6-pixabay.mp3'),
        this.audioMark.preloadAudio('Beep', 'audio/bleep-pixabay.mp3'),
        this.audioMark.preloadAudio('GameOver', 'audio/endgame-pixabay.mp3'),
      ];

      this._preloadPromise = Promise.all(tasks)
        .then(() => {
          this.audioPreloaded = true;
          // this.doToast('Preload audio complete...', '', 'success');
        })
        .catch((err) => {
          this.audioPreloaded = true; // still mark as done, caller can inspect errors/logs
          this.doToast('Preload audio encountered errors', err.message || '', 'error');
        });
    }

    return this._preloadPromise;
  }

  waitForPreload() {
    return this._preloadPromise || Promise.resolve(this.audioPreloaded);
  }

  async initialize() {
    // this.doToast('Initialize audio started...', '', 'info');

    await this.audioMark.initialize();
    const processResults = await this.audioMark.processAllPreloadedAudio();

    // Check if all audio processing completed successfully
    if (Array.isArray(processResults)) {
      const failedItems = processResults.filter((result) => !result.success);
      if (failedItems.length > 0) {
        this.doToast('Some audio files failed to process', `Failed: ${failedItems.map((f) => f.name).join(', ')}`, 'error');
      }
      // else {
      //     this.doToast('All audio files processed successfully', `Processed: ${processResults.length} files`, 'success');
      // }
    }

    // this.doToast('Initialize audio completed', '', 'success');
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

  isAudioInitialized() {
    return this.audioMark.isInitialized;
  }

  getAudioState() {
    return this.audioMark.getState();
  }

  isAllPreloadedAudioProcessed() {
    const state = this.audioMark.getState();
    // If there are no preloaded audio items remaining and we have loaded audio, processing is complete
    return state.preloadedAudio.length === 0 && state.loadedAudio.length > 0;
  }

  getAudioProcessingStatus() {
    const state = this.audioMark.getState();
    return {
      isProcessingComplete: this.isAllPreloadedAudioProcessed(),
      preloadedCount: state.preloadedAudio.length,
      loadedCount: state.loadedAudio.length,
      preloadedItems: state.preloadedAudio,
      loadedItems: state.loadedAudio,
    };
  }
}
