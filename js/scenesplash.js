import { SceneBase } from './scenebase.js';

export class SceneSplash extends SceneBase {
    constructor(canvas, manager) {
        super(canvas, manager);

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
                        <h1 style="font-size: 72px; font-weight: bold; color: #ffffff;">OH BALLS</h1>
                        <h2 style="font-size: 32px; color: #cccccc;">Physics Game</h2>
                        <p style="font-size: 24px; color: #999999;">Loading...</p>
                    </div>
                </div>
            `;

        SceneBase.createMenuButtons('Main Menu', this.menuContainerId, this.menuOptions, this.selectedOption, (idx, opt) => {
            if (idx === 1) {
                this.nextScene = SceneBase.GameScenes.settings;
            } else if (idx === 0) {
                this.nextScene = SceneBase.GameScenes.ballsX;
            }
        });
    }

    inputKeyPressed(comboId) {
        if (comboId === 'Escape') {
            this.exitFlag = true;
        }
    }
}
