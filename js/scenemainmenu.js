import { SceneBase } from './scenebase.js';

export class SceneMainmenu extends SceneBase {
    constructor(canvas, manager) {
        super(canvas, manager);

        this.selectedOption = 0;
        this.nextScene = null;

        this.menuOptions = ['Start Game', 'Settings'];
        this.menuContainerId = 'mainmenuButtons';
    }

    enter() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Main Menu';
        }
    }

    exit() {
        this.hideOverlay();
    }

    setNextScene(sel) {
        if (sel === 1) {
            this.nextScene = SceneBase.GameScenes.settings;
        } else if (sel === 0) {
            this.nextScene = SceneBase.GameScenes.ballsX;
        }
    }

    insertHTMLOverlayContent() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        overlay.innerHTML = `
                <div class="mainmenu-ui">
                    <div class="menu-panel">
                        <div id="mainmenuButtons" class="mainmenu-buttons"></div>
                        <div class="settings-footer">↑ ↓ Navigate • ENTER to select</div>
                    </div>
                </div>
            `;

        SceneBase.createMenuButtons('Main Menu', this.menuContainerId, this.menuOptions, this.selectedOption, (idx, opt) => {
            this.setNextScene(idx);
        });
    }

    update(dt) {
        return this.nextScene;
    }

    render(ctx) {}

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Menu</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    inputKeyPressed(comboId) {
        switch (comboId) {
            case 'ArrowUp':
                if (this.selectedOption > 0) {
                    this.selectedOption = this.selectedOption - 1;
                    SceneBase.setSelectedButton(this.menuContainerId, this.selectedOption);
                }
                break;
            case 'ArrowDown':
                if (this.selectedOption < this.menuOptions.length - 1) {
                    this.selectedOption = this.selectedOption + 1;
                    SceneBase.setSelectedButton(this.menuContainerId, this.selectedOption);
                }
                break;
            case 'Enter':
                this.setNextScene(this.selectedOption);
                break;
            case 'Escape':
                break;
            default:
                break;
        }
    }
}
