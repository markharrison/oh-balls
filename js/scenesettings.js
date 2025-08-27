import { SceneBase } from './scenebase.js';

export class SceneSettings extends SceneBase {
    constructor(sceneManager) {
        super(sceneManager);

        this.nextScene = null;
    }

    enter2() {
        this.showOverlay();
        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings';
        }
    }

    exit2() {
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

    updateFrame() {
        return this.nextScene;
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Settings</strong><br>
        `;
        return vHtml;
    }

    inputKeyPressedOther(comboId) {}
}

// ------------ Audio -------------------

export class SceneSettingsAudio extends SceneBase {
    constructor(sceneManager) {
        super(sceneManager);

        this.nextScene = null;
    }

    enter2() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings Audio';
        }
    }

    exit2() {
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

    focusNext() {
        const arr = this._settingsFocusable || [];
        const idx = arr.indexOf(document.activeElement);
        if (idx < 0 || idx === arr.length - 1) {
            // Already at last control or not found, stay on current
            if (arr[idx]) arr[idx].focus();
            return;
        }
        arr[idx + 1].focus();
    }

    focusPrev() {
        const arr = this._settingsFocusable || [];
        const idx = arr.indexOf(document.activeElement);
        if (idx <= 0) {
            // Already at first control or not found, stay on current
            if (arr[idx]) arr[idx].focus();
            return;
        }
        arr[idx - 1].focus();
    }

    handleLeft() {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.type === 'range') {
            let volume = parseInt(activeElement.value, 10);
            volume = Math.max(parseInt(activeElement.min, 10), volume - parseInt(activeElement.step, 10));
            activeElement.value = volume;
            activeElement.dispatchEvent(new Event('input'));
        } else if (activeElement.id === 'idAudio') {
            document.getElementById('idAudio').checked = false;
        }
    }

    handleRight() {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.type === 'range') {
            let volume = parseInt(activeElement.value, 10);
            volume = Math.min(parseInt(activeElement.max, 10), volume + parseInt(activeElement.step, 10));
            activeElement.value = volume;
            activeElement.dispatchEvent(new Event('input'));
        } else if (activeElement.id === 'idAudio') {
            document.getElementById('idAudio').checked = true;
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
        const initMasterVolume = this.configManager.masterVolume;
        const initMusicVolume = this.configManager.musicVolume;
        const initSfxVolume = this.configManager.sfxVolume;
        const initAudio = this.configManager.audio ? 'checked' : '';

        vHtml = '';
        vHtml = `
            <form>
                <div class="mb-3 form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="idAudio" ${initAudio} data-idx="1" tabindex="0">
                    <label class="form-check-label" for="idAudio">Audio</label>
                </div>

                <div class="volume-control">
                    <label for="idMasterVolume" class="form-label">Master Volume:</label>
                    <input type="range" class="form-range" min="0" max="100" step="10" value="${initMasterVolume}" id="idMasterVolume" data-config-key="masterVolume" tabindex="0">
                    <span id="idMasterVolumeValue" class="volume-value">${initMasterVolume}</span>
                </div>

                <div class="volume-control">
                    <label for="idMusicVolume" class="form-label">Music Volume:</label>
                    <input type="range" class="form-range" min="0" max="100" step="10" value="${initMusicVolume}" id="idMusicVolume" data-config-key="musicVolume" tabindex="0">
                    <span id="idMusicVolumeValue" class="volume-value">${initMusicVolume}</span>
                </div>

                <div class="volume-control">
                    <label for="idSfxVolume" class="form-label">Sfx Volume:</label>
                    <input type="range" class="form-range" min="0" max="100" step="10" value="${initSfxVolume}" id="idSfxVolume" data-config-key="sfxVolume" tabindex="0">
                    <span id="idSfxVolumeValue" class="volume-value">${initSfxVolume}</span>
                </div>

                <button id="idSaveSettings" type="button" class="btn btn-primary" data-idx="3" tabindex="0">Save</button>
            </form>
        `;
        panel.innerHTML = vHtml;

        setTimeout(() => {
            this._boundSaveSettings = this.saveSettings.bind(this);
            document.getElementById('idSaveSettings').addEventListener('click', this._boundSaveSettings);

            const audioControl = document.getElementById('idAudio');
            if (audioControl) {
                audioControl.focus();
            }

            const panelControls = panel.querySelectorAll('input, select, textarea, button');
            this._settingsFocusable = Array.from(panelControls);

            document.querySelectorAll('input[type="range"]').forEach((r) => {
                const computed = getComputedStyle(document.documentElement);
                const fillColor = computed.getPropertyValue('--bs-primary')?.trim() || '#007bff';
                const trackColor = computed.getPropertyValue('--bs-light')?.trim() || 'rgba(255,255,255,0.85)';
                const valueSpan = document.getElementById(`${r.id}Value`);

                const updateRangeVisuals = (elem) => {
                    const val = Number(elem.value || 0);
                    const min = Number(elem.min || 0);
                    const max = Number(elem.max || 100);
                    const range = max - min || 1;
                    const pct = Math.round(((val - min) / range) * 100);
                    elem.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`;
                    if (valueSpan) {
                        valueSpan.textContent = val;
                    }
                };

                updateRangeVisuals(r);

                r.addEventListener('input', () => updateRangeVisuals(r));
            });
        }, 5);
    }

    // Handler for Save button (must be at class level)
    saveSettings(e) {
        e.preventDefault();
        const audioEnabled = document.getElementById('idAudio').checked;
        this.configManager.audio = audioEnabled;

        document.querySelectorAll('input[type="range"]').forEach((slider) => {
            const configKey = slider.dataset.configKey;
            if (configKey) {
                this.configManager[configKey] = parseInt(slider.value, 10);
            }
        });

        this.configManager.saveToLocalStorage();
        this.sceneManager.doToast('Audio Settings', 'Settings updated.');
        this.nextScene = SceneBase.GameScenes.settings;
    }

    deleteEventListeners() {
        const saveBtn = document.getElementById('idSaveSettings');
        if (saveBtn && this._boundSaveSettings) {
            saveBtn.removeEventListener('click', this._boundSaveSettings);
            this._boundSaveSettings = null;
        }
    }

    updateFrame() {
        return this.nextScene;
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Audio Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    getSpecialKeys() {
        return ['Escape', 'Control+KeyM'];
    }

    inputKeyPressedOther(comboId) {
        switch (comboId) {
            case 'Escape':
                this.nextScene = SceneBase.GameScenes.settings;
                break;
            case 'ArrowDown':
                this.focusNext();
                break;
            case 'ArrowUp':
                this.focusPrev();
                break;
            case 'ArrowLeft':
                this.handleLeft();
                break;
            case 'ArrowRight':
                this.handleRight();
                break;
            case 'Enter':
                let ele = document.activeElement;
                if (ele) {
                    ele.click();
                }
                break;
            default:
                break;
        }
    }
}

// ------------ Theme -------------------

export class SceneSettingsTheme extends SceneBase {
    constructor(sceneManager) {
        super(sceneManager);

        this.nextScene = null;
    }

    enter2() {
        this.showOverlay();

        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Settings Theme';
        }
    }

    exit2() {
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

    focusNext() {
        const arr = this._settingsFocusable || [];
        const idx = arr.indexOf(document.activeElement);
        if (idx < 0 || idx === arr.length - 1) {
            if (arr[idx]) arr[idx].focus();
            return;
        }
        arr[idx + 1].focus();
    }

    focusPrev() {
        const arr = this._settingsFocusable || [];
        const idx = arr.indexOf(document.activeElement);
        if (idx <= 0) {
            if (arr[idx]) arr[idx].focus();
            return;
        }
        arr[idx - 1].focus();
    }

    handleLeft() {
        const activeElementId = document.activeElement.id;

        switch (activeElementId) {
            case 'idTheme':
                let idx = document.getElementById('idTheme').selectedIndex;
                idx = Math.max(0, idx - 1);
                document.getElementById('idTheme').selectedIndex = idx;
                break;

            default:
                break;
        }
    }

    handleRight() {
        const activeElementId = document.activeElement.id;

        switch (activeElementId) {
            case 'idTheme':
                const select = document.getElementById('idTheme');
                const maxItems = select.options.length;
                let idx = document.getElementById('idTheme').selectedIndex;
                idx = Math.min(maxItems - 1, idx + 1);
                document.getElementById('idTheme').selectedIndex = idx;
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

        const initTheme = this.configManager.theme;

        vHtml = '';
        vHtml = `
            <form>
                <div class="mb-3">
                    <label for="idTheme" class="form-label">Theme: </label>
                    <select class="form-select" id="idTheme">
                        <option value="Default">Default</option>
                        <option value="One">One</option>
                        <option value="Two">Two</option>
                        <option value="Three">Three</option>
                    </select>
                </div>

                <button id="idSaveSettings" type="button" class="btn btn-primary">Save</button>
            </form>
        `;
        panel.innerHTML = vHtml;

        setTimeout(() => {
            this._boundSaveSettings = this.saveSettings.bind(this);
            document.getElementById('idSaveSettings').addEventListener('click', this._boundSaveSettings);

            const themeControl = document.getElementById('idTheme');
            if (themeControl) {
                // Set selected option to match initTheme
                for (let i = 0; i < themeControl.options.length; i++) {
                    if (themeControl.options[i].value === initTheme) {
                        themeControl.selectedIndex = i;
                        break;
                    }
                }
                themeControl.focus();
            }

            const panelControls = panel.querySelectorAll('input, select, textarea, button');
            this._settingsFocusable = Array.from(panelControls);
        }, 5);
    }

    saveSettings(e) {
        e.preventDefault();
        const theme = document.getElementById('idTheme').value;
        this.configManager.theme = theme;

        this.configManager.saveToLocalStorage();
        this.sceneManager.doToast('Theme Settings', 'Updated. Theme: ' + theme);
        this.nextScene = SceneBase.GameScenes.settings;
    }

    deleteEventListeners() {
        const saveBtn = document.getElementById('idSaveSettings');
        if (saveBtn && this._boundSaveSettings) {
            saveBtn.removeEventListener('click', this._boundSaveSettings);
            this._boundSaveSettings = null;
        }
    }

    updateFrame() {
        return this.nextScene;
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Theme Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    getSpecialKeys() {
        return ['Escape', 'Control+KeyM'];
    }

    inputKeyPressedOther(comboId) {
        switch (comboId) {
            case 'Escape':
                this.nextScene = SceneBase.GameScenes.settings;
                break;
            case 'ArrowDown':
                this.focusNext();
                break;
            case 'ArrowUp':
                this.focusPrev();
                break;
            case 'ArrowLeft':
                this.handleLeft();
                break;
            case 'ArrowRight':
                this.handleRight();
                break;
            case 'Enter':
                let ele = document.activeElement;
                if (ele) {
                    ele.click();
                }
                break;
            default:
                break;
        }
    }
}
