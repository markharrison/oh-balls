import { SceneBase } from './scenebase.js';

export class SceneSplash extends SceneBase {
    constructor(manager) {
        super(manager);

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
    }

    exit() {
        this.hideOverlay();
    }

    update(dt) {
        if (performance.now() - this.startTime >= 5000 || this.exitFlag) {
            return SceneBase.GameScenes.mainmenu;
        }

        return null; // Stay in this scene
    }

    render(ctx) {}

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
                    </div>
                </div>
            `;
    }

    inputKeyPressed(comboId) {
        if (comboId === 'Escape') {
            this.exitFlag = true;
        }
    }
}
