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

        this.menuOptions = ['Home'];
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
                    <div class="settings-title">Audio Settings</div>
                    <div class="settings-panel-ui">
                        <label for="idVolumeSlider" class="settings-label">Volume:&nbsp;</label>
                        <input type="range" id="idVolumeSlider" min="0" max="100" value="50">
                        <br><br>
                        <label class="settings-label" for="idAudioToggle">Audio:&nbsp;</label>
                        <input type="checkbox" id="idAudioToggle" checked tabindex="0" class="audio-toggle-checkbox">
                        <label class="toggle-switch" for="idAudioToggle">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            `;

        setTimeout(() => {
            const slider = document.getElementById('idVolumeSlider');
            if (slider) {
                // focus the slider for keyboard accessibility
                slider.focus();

                // updates the slider background to show a green filled track up to the current value
                const updateSliderBg = (s) => {
                    const min = parseFloat(s.min) || 0;
                    const max = parseFloat(s.max) || 100;
                    const val = parseFloat(s.value) || 0;
                    const pct = ((val - min) / (max - min)) * 100;
                    // green for the filled portion, light gray for the remainder
                    s.style.background = `linear-gradient(90deg, #28a745 ${pct}%, #ddd ${pct}%)`;
                };

                const onInput = () => updateSliderBg(slider);
                slider.addEventListener('input', onInput);
                slider.addEventListener('change', onInput);

                // initialize the background immediately
                updateSliderBg(slider);
            }
        }, 50);
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

    getSpecialKeys() {
        return ['Escape', 'Enter', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'Control+KeyD'];
    }

    inputKeyPressedOther(comboId) {
        switch (comboId) {
            case 'ArrowRight':
                alert('Right arrow pressed');
                break;
            case 'ArrowLeft':
                SceneBase.setSelectedButton(this.menuContainerId, this.selectedOption);
                break;
            default:
                break;
        }
    }
}
