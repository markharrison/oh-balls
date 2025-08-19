import { SceneBase } from './scenebase.js';

export class SceneSettings extends SceneBase {
    constructor(canvas, manager) {
        super(canvas, manager);

        this.returnToMenu = false;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        // Sample configuration options
        this.config = {
            soundEnabled: true,
            difficulty: 'Medium',
            graphics: 'High',
        };

        this.selectedOption = 0;
        this.options = ['Sound', 'Difficulty', 'Graphics', 'Back'];
    }

    enter() {
        this.showSettingsOverlay();
    }

    exit() {
        this.hideSettingsOverlay();
    }

    insertHTMLOverlayContent() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="settings-ui">
                <div class="settings-title">SETTINGS</div>
                <div class="settings-row settings-sound">
                    <span class="settings-label">Sound:</span>
                    <span class="settings-value">
                        <select id="soundSelect" class="settings-select">
                            <option value="true" ${this.config.soundEnabled ? 'selected' : ''}>On</option>
                            <option value="false" ${!this.config.soundEnabled ? 'selected' : ''}>Off</option>
                        </select>
                    </span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">Difficulty:</span>
                    <span class="settings-value">
                        <select id="difficultySelect" class="settings-select">
                            <option value="Easy" ${this.config.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                            <option value="Medium" ${this.config.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="Hard" ${this.config.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                        </select>
                    </span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">Graphics:</span>
                    <span class="settings-value">
                        <select id="graphicsSelect" class="settings-select">
                            <option value="Low" ${this.config.graphics === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Medium" ${this.config.graphics === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="High" ${this.config.graphics === 'High' ? 'selected' : ''}>High</option>
                        </select>
                    </span>
                </div>
<!--
                <div class="settings-row settings-back">
                    <span class="settings-label">Back:</span>
                    <span class="settings-value">
                        <a id="backLink" class="settings-back-link" href="#">Back</a>
                    </span>
                </div>
                -->
                <div class="settings-footer">↑ ↓ Navigate • ENTER Select • ESC Back</div>
            </div>
        `;

        // Add event listeners for controls
        // Use single block to avoid redeclaration errors
        {
            let soundSelect = document.getElementById('soundSelect');
            if (soundSelect) {
                soundSelect.onchange = (e) => {
                    this.config.soundEnabled = e.target.value === 'true';
                };
            }
            let difficultySelect = document.getElementById('difficultySelect');
            if (difficultySelect) {
                difficultySelect.onchange = (e) => {
                    this.config.difficulty = e.target.value;
                };
            }
            let graphicsSelect = document.getElementById('graphicsSelect');
            if (graphicsSelect) {
                graphicsSelect.onchange = (e) => {
                    this.config.graphics = e.target.value;
                };
            }
            let backLink = document.getElementById('backLink');
            if (backLink) {
                backLink.onclick = (e) => {
                    e.preventDefault();
                    this.hideSettingsOverlay();
                    if (this.manager) this.manager.popScene();
                };
            }
        }

        // Add event listeners for controls
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.onclick = () => {
                this.config.soundEnabled = !this.config.soundEnabled;
                this.insertHTMLOverlayContent();
            };
        }
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            difficultySelect.onchange = (e) => {
                this.config.difficulty = e.target.value;
            };
        }
        const graphicsSelect = document.getElementById('graphicsSelect');
        if (graphicsSelect) {
            graphicsSelect.onchange = (e) => {
                this.config.graphics = e.target.value;
            };
        }
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.onclick = () => {
                this.hideSettingsOverlay();
                if (this.manager) this.manager.popScene();
            };
        }
    }

    updateCanvasOverlayPosition() {
        const canvas = document.getElementById('idCanvas');
        const overlay = document.getElementById('idCanvasOverlay');
        if (!canvas || !overlay) return;
        const rect = canvas.getBoundingClientRect();
        overlay.style.position = 'absolute';
        overlay.style.left = rect.left + window.scrollX + 'px';
        overlay.style.top = rect.top + window.scrollY + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.pointerEvents = 'auto';
        overlay.style.zIndex = '100';
    }

    showSettingsOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        this.insertHTMLOverlayContent();
        this.updateCanvasOverlayPosition();
        overlay.style.display = 'block';
        // Add resize listener to keep overlay in sync
        if (!this._resizeHandler) {
            this._resizeHandler = () => {
                if (overlay.style.display === 'block') {
                    this.updateCanvasOverlayPosition();
                }
            };
            window.addEventListener('resize', this._resizeHandler);
        }
    }

    hideSettingsOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        overlay.style.display = 'none';
        // Remove resize listener
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }

    update(dt) {
        // Update timing
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        if (this.returnToMenu) {
            this.hideSettingsOverlay();
            return SceneBase.GameScenes.mainmenu;
        }

        return null; // No automatic transitions - handled by input
    }

    render(ctx) {}

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Settings</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    inputKeyPressed(code) {
        switch (code) {
            case 'Escape':
                this.returnToMenu = true;
                break;
            default:
                break;
        }
    }
}
