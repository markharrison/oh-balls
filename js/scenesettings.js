import { SceneBase } from './scenebase.js';

export class SceneSettings extends SceneBase {
    constructor(manager) {
        super(manager);

        this.nextScene = null;
    }

    enter() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings';
        }
    }

    exit() {
        this.deleteMenuEventListeners();
        this.hideOverlay();
    }

    doMenuHandler(sel) {
        switch (sel) {
            case 1:
                this.nextScene = SceneBase.GameScenes.mainmenu;
                break;
            case 2:
                this.nextScene = SceneBase.GameScenes.settingsaudio;
                break;
            case 3:
                this.nextScene = SceneBase.GameScenes.settingstheme;
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
        vHtml += '<div><h3 class="overlay-title">Settings</h3></div><div>&nbsp;</div>';
        vHtml += '<div id="idButtonContainer" class="d-grid gap-2">';

        vHtml += '</div>';
        vHtml += '<div>&nbsp;</div>';
        vHtml += '</div>';

        overlay.innerHTML = vHtml;

        this.addMenuButtons(['Home', 'Audio', 'Theme']);
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

    inputKeyPressedOther(comboId) {
        // Handle other keys specific to SceneSettings here
    }
}

// ------------ Audio -------------------

export class SceneSettingsAudio extends SceneBase {
    constructor(manager) {
        super(manager);

        this.nextScene = null;
    }

    enter() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings Audio';
        }
    }

    exit() {
        this.deleteEventListeners();
        this.hideOverlay();
    }

    doMenuHandler(sel) {
        switch (sel) {
            case 1:
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
        vHtml += '<div><h3 class="overlay-title">Audio Settings</h3></div><div>&nbsp;</div>';
        vHtml += '<div id="idButtonContainer" class="d-grid gap-2">';

        vHtml += '</div>';
        vHtml += '<div id="idSettingsPanel" class="settings-panel" role="region">';
        vHtml += '</div>';
        vHtml += '</div>';

        overlay.innerHTML = vHtml;

        const panel = document.getElementById('idSettingsPanel');
        if (!panel) return;

        // Get current config values
        const initVolume = this.config.volume;
        const initAudio = this.config.audio ? 'checked' : '';

        vHtml = '';
        vHtml = `
            <form>
                <div class="mb-3 form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="idAudio" ${initAudio}>
                    <label class="form-check-label" for="idAudio">Audio</label>
                </div>

                <div class="mb-3" style="max-width: 300px;">
                    <label for="idVolume" class="form-label">Volume: </label>
                    <input type="range" class="form-range" min="0" max="100" step="10" value="${initVolume}" id="idVolume">
                 </div>
                <button id="idSaveSettings" type="button" class="btn btn-primary">Save</button>
            </form>
        `;
        panel.innerHTML = vHtml;

        // Attach save handler with correct context
        this._boundSaveSettings = this.saveSettings.bind(this);
        document.getElementById('idSaveSettings').addEventListener('click', this._boundSaveSettings);
    }

    // Handler for Save button (must be at class level)
    saveSettings(e) {
        e.preventDefault();
        const volume = parseInt(document.getElementById('idVolume').value, 10);
        const audioEnabled = document.getElementById('idAudio').checked;

        this.config.volume = volume;
        this.config.audio = audioEnabled;
        this.config.saveToLocalStorage();
        this.manager.doToast('Audio Settings', 'Updated.  Volume: ' + volume + ', Audio: ' + (audioEnabled ? 'On' : 'Off'));
        this.nextScene = SceneBase.GameScenes.settings;
    }

    deleteEventListeners() {
        const saveBtn = document.getElementById('idSaveSettings');
        if (saveBtn && this._boundSaveSettings) {
            saveBtn.removeEventListener('click', this._boundSaveSettings);
            this._boundSaveSettings = null;
        }
    }

    update(dt) {
        return this.nextScene;
    }

    render(ctx) {}

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Audio Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    getSpecialKeys() {
        return ['Escape', 'Control+KeyD'];
    }

    inputKeyPressedOther(comboId) {
        switch (comboId) {
            case 'Escape':
                this.nextScene = SceneBase.GameScenes.settings;
                break;
            default:
                break;
        }
    }
}

// ------------ Theme -------------------

export class SceneSettingsTheme extends SceneBase {
    constructor(manager) {
        super(manager);

        this.nextScene = null;
    }

    enter() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings Theme';
        }
    }

    exit() {
        this.deleteEventListeners();
        this.hideOverlay();
    }

    doMenuHandler(sel) {
        switch (sel) {
            case 1:
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
        vHtml += '<div><h3 class="overlay-title">Theme Settings</h3></div><div>&nbsp;</div>';
        vHtml += '<div id="idButtonContainer" class="d-grid gap-2">';

        vHtml += '</div>';
        vHtml += '<div id="idSettingsPanel" class="settings-panel" role="region">';
        vHtml += '</div>';
        vHtml += '</div>';

        overlay.innerHTML = vHtml;

        const panel = document.getElementById('idSettingsPanel');
        if (!panel) return;

        // Get current config values
        const initTheme = this.config.theme;

        vHtml = '';
        vHtml = `
            <form>
                <div class="mb-3">
                    <label for="idTheme" class="form-label">Theme: </label>
                    <select class="form-select" id="idTheme">
                        <option selected>Default</option>
                        <option value="One">One</option>
                        <option value="Two">Two</option>
                        <option value="Three">Three</option>
                    </select>
                </div>

                <button id="idSaveSettings" type="button" class="btn btn-primary">Save</button>
            </form>
        `;
        panel.innerHTML = vHtml;

        // Attach save handler with correct context
        this._boundSaveSettings = this.saveSettings.bind(this);
        document.getElementById('idSaveSettings').addEventListener('click', this._boundSaveSettings);
    }

    // Handler for Save button (must be at class level)
    saveSettings(e) {
        e.preventDefault();
        const theme = document.getElementById('idTheme').value;
        this.config.theme = theme;

        this.config.saveToLocalStorage();
        this.manager.doToast('Theme Settings', 'Updated. Theme: ' + theme);
        this.nextScene = SceneBase.GameScenes.settings;
    }

    deleteEventListeners() {
        const saveBtn = document.getElementById('idSaveSettings');
        if (saveBtn && this._boundSaveSettings) {
            saveBtn.removeEventListener('click', this._boundSaveSettings);
            this._boundSaveSettings = null;
        }
    }

    update(dt) {
        return this.nextScene;
    }

    render(ctx) {}

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Theme Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    getSpecialKeys() {
        return ['Escape', 'Control+KeyD'];
    }

    inputKeyPressedOther(comboId) {
        switch (comboId) {
            case 'Escape':
                this.nextScene = SceneBase.GameScenes.settings;
                break;
            default:
                break;
        }
    }
}
