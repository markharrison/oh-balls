import { SceneBase } from './scenebase.js';

export class SceneMainmenu extends SceneBase {
    constructor(manager) {
        super(manager);

        this.nextScene = null;
    }

    enter() {
        this.showOverlay();
        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Main Menu';
        }
    }

    exit() {
        this.deleteMenuEventListeners();
        this.hideOverlay();
    }

    doMenuHandler(sel) {
        switch (sel) {
            case 1:
                this.nextScene = SceneBase.GameScenes.ballsX;
                break;
            case 2:
                this.nextScene = SceneBase.GameScenes.settings;
                break;
            default:
                break;
        }
    }

    insertHTMLOverlayContent() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;

        let vHtml = '';

        vHtml += '<div class="canvas-overlay-page">';
        vHtml += '<div><h3 class="overlay-title">Main Menu</h3></div><div>&nbsp;</div>';
        vHtml += '<div id="idButtonContainer" class="d-grid gap-2">';

        vHtml += '</div>';
        vHtml += '<div>&nbsp;</div>';
        vHtml += '</div>';

        overlay.innerHTML = vHtml;

        this.addMenuButtons(['Start Game', 'Settings']);
    }

    updateFrame() {
        return this.nextScene;
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Menu</strong><br>
        `;
        return vHtml;
    }

    getSpecialKeys() {
        return ['Enter', 'ArrowUp', 'ArrowDown', 'Control+KeyY', 'Control+KeyV'];
    }
}
