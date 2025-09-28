import { SceneBase } from './scenebase.js';

export class SceneSplash extends SceneBase {
    constructor(sceneManager) {
        super(sceneManager);

        this.startTime = null;
        this.imageHandler = this.objectManager.getById('ImageHandler');
    }

    enter() {
        this.showOverlay();
        this.startTime = performance.now();
        this.exitFlag = false;

        this.audioHandler = this.objectManager.getById('AudioHandler');
    }

    exit() {
        this.hideOverlay();
    }

    updateFrame(dt) {
        if (this.exitFlag) {
            this.audioHandler.setVolume(
                this.configManager.masterVolume,
                this.configManager.musicVolume,
                this.configManager.sfxVolume
            );
            this.audioHandler.playMusic('MenuMusic');

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

    async insertHTMLOverlayContent() {
        let smilesImage = await this.imageHandler.loadImage('images/smiles.png', 'smiles');
        // ...existing code...

        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        overlay.innerHTML = `
            <div >
                <br /><br /><br /><br /><br />
                <div style="text-align: center;">
                                    <img src="${smilesImage.src}" alt="Smiles" style="width: 400px; height: auto; margin-top: 20px;"/>
                    <br />
                    <h1 style="font-size: 72px; font-weight: bold; color: #ffffff;">OH BALLS MERGE</h1>
                     <p id="idVersionText" style="font-size: 24px; color: #ffffff; display: block;">Version 0.001 - 28 Oct 2025</p>                   
                    <p id="idLoadingText" style="font-size: 24px; color: #ffffff; display: none;">Loading...</p>
                    <br />
                    <button id="idButtonEnter" class="btn btn-primary  btn-lg ">Enter</button>
                </div>
            </div>
        `;

        const btnEnter = document.getElementById('idButtonEnter');

        btnEnter.onclick = async () => {
            await this.doPostUserInteraction();
        };
    }

    async doPostUserInteraction() {
        const btnEnter = document.getElementById('idButtonEnter');
        btnEnter.style.display = 'none';

        const loadingText = document.getElementById('idLoadingText');
        loadingText.style.display = 'block';

        const versionText = document.getElementById('idVersionText');
        versionText.style.display = 'none';

        await this.audioHandler.waitForPreload();
        await this.audioHandler.initialize();

        setTimeout(() => {
            this.exitFlag = true;
        }, 1000);
    }

    inputKeyPressed(comboId) {
        switch (comboId) {
            case 'Escape':
            case 'Enter':
                const btnEnter = document.getElementById('idButtonEnter');
                if (btnEnter) {
                    btnEnter.click();
                }
                break;
        }
    }
}
