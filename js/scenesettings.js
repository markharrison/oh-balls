import { SceneBase } from './scenebase.js';

export class SceneSettings extends SceneBase {
    constructor(canvas, manager) {
        super(canvas, manager);

        this.selectedOption = 0;
        this.nextScene = null;

        this.menuOptions = ['Home', 'Audio', 'Theme'];
        this.menuContainerId = 'mainmenuButtons';
    }

    enter() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings';
        }
    }

    exit() {
        this.hideOverlay();
    }

    setNextScene(sel) {
        if (sel === 0) {
            this.nextScene = SceneBase.GameScenes.mainmenu;
        } else if (sel === 1) {
            this.nextScene = SceneBase.GameScenes.settingsaudio;
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
                    <div id="menuDetailPanel" class="detail-panel" >
                        Hello
                    </div>
                </div>
            `;

        SceneBase.createMenuButtons('Settings', this.menuContainerId, this.menuOptions, this.selectedOption, (idx, opt) => {
            this.setNextScene(idx);
        });
    }

    update(dt) {
        return this.nextScene;
    }

    render(ctx) {}

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    // inputKeyPressed now inherited from SceneBase

    inputKeyPressedOther(comboId) {
        // Handle other keys specific to SceneSettings here
    }
}

// ------------ Audio -------------------

export class SceneSettingsAudio extends SceneBase {
    constructor(canvas, manager) {
        super(canvas, manager);

        this.selectedOption = 0;
        this.nextScene = null;

        this.menuOptions = ['Home', 'xxxxx'];
        this.menuContainerId = 'mainmenuButtons';
    }

    enter() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings Audio';
        }
    }

    exit() {
        this.hideOverlay();
    }

    setNextScene(sel) {
        if (sel === 0) {
            this.nextScene = SceneBase.GameScenes.settings;
        } else if (sel === 99) {
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
                    <div id="menuDetailPanel" class="detail-panel" >
                        Hello
                    </div>
                </div>
            `;

        SceneBase.createMenuButtons('Audio', this.menuContainerId, this.menuOptions, this.selectedOption, (idx, opt) => {
            this.setNextScene(idx);
        });
    }

    update(dt) {
        return this.nextScene;
    }

    render(ctx) {}

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    // inputKeyPressed now inherited from SceneBase

    inputKeyPressedOther(comboId) {
        // Handle other keys specific to SceneSettingsAudio here
    }
}
