import { SceneBase } from './scenebase.js';

export class SceneSplash extends SceneBase {
    constructor(sceneManager) {
        super(sceneManager);

        this.startTime = null;
    }

    enter() {
        this.showOverlay();
        this.startTime = performance.now();
        this.exitFlag = false;
        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Splash Screen';
        }

        this.audio = this.objectManager.get('AudioHandler');

        this.audio.initialize();
    }

    exit() {
        this.hideOverlay();
    }

    updateFrame(dt) {
        if (this.exitFlag) {
            this.audio.setVolume(this.configManager.masterVolume, this.configManager.musicVolume, this.configManager.sfxVolume);
            this.audio.playMusic('MenuMusic');

            return SceneBase.GameScenes.mainmenu;
        }

        return null; // Stay in this scene
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Splash</strong><br>
        `;
        return vHtml;
    }

    insertHTMLOverlayContent() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        overlay.innerHTML = `
                <div >
                    <br /><br /><br /><br /><br />
                    <div style="text-align: center;">
                        <h1 style="font-size: 72px; font-weight: bold; color: #ffffff;">OH BALLS MERGE</h1>
                        <h2 style="font-size: 32px; color: #cccccc;">Physics Game</h2>
                        <p style="font-size: 24px; color: #999999;">Loading...</p>
                        <br /><br /><br /><br />
                        <button id="idButtonEnter" class="btn btn-primary  btn-lg ">Enter</button>

                    </div>
                </div>
            `;

        const btnEnter = document.getElementById('idButtonEnter');

        btnEnter.onclick = () => {
            this.exitFlag = true;
        };
    }

    inputKeyPressed(comboId) {
        switch (comboId) {
            case 'Escape':
            case 'Enter':
                this.exitFlag = true;
                break;
        }
    }
}
