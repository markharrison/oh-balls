import { SceneBase } from './scenebase.js';

export class SceneSettings extends SceneBase {
    constructor(canvas, manager) {
        super(manager);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

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
        // Called when the scene becomes active
        this.showSettingsOverlay();
        this.updateSelectedOption();
    }

    exit() {
        // Called when the scene is deactivated
        this.hideSettingsOverlay();
    }

    update(dt) {
        // Update timing
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        return null; // No automatic transitions - handled by input
    }

    render(ctx) {
        this.renderScene();
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Settings</strong><br>
            Sound: ${this.config.soundEnabled ? 'On' : 'Off'}<br>
            Difficulty: ${this.config.difficulty}<br>
            Graphics: ${this.config.graphics}
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Settings';

        // Clear canvas with dark background - overlay will handle the UI
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    toggleCurrentOption() {
        switch (this.selectedOption) {
            case 0: // Sound
                this.config.soundEnabled = !this.config.soundEnabled;
                break;
            case 1: // Difficulty
                const difficulties = ['Easy', 'Medium', 'Hard'];
                const currentIndex = difficulties.indexOf(this.config.difficulty);
                this.config.difficulty = difficulties[(currentIndex + 1) % difficulties.length];
                break;
            case 2: // Graphics
                const graphics = ['Low', 'Medium', 'High'];
                const currentGraphicsIndex = graphics.indexOf(this.config.graphics);
                this.config.graphics = graphics[(currentGraphicsIndex + 1) % graphics.length];
                break;
            case 3: // Back
                // Return to previous scene - handled by SceneManager
                break;
        }
        this.updateConfigValues();
    }

    showSettingsOverlay() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.updateConfigValues();
        }
    }

    hideSettingsOverlay() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    updateConfigValues() {
        const soundElement = document.getElementById('soundValue');
        const difficultyElement = document.getElementById('difficultyValue');
        const graphicsElement = document.getElementById('graphicsValue');

        if (soundElement) {
            soundElement.textContent = this.config.soundEnabled ? 'ON' : 'OFF';
        }
        if (difficultyElement) {
            difficultyElement.textContent = this.config.difficulty;
        }
        if (graphicsElement) {
            graphicsElement.textContent = this.config.graphics;
        }
    }

    updateSelectedOption() {
        // Remove previous selection
        const options = document.querySelectorAll('.setting-option');
        options.forEach(option => option.classList.remove('selected'));

        // Add selection to current option
        const selectedOption = document.querySelector(`[data-option="${this.selectedOption}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    inputKeyPressed(code, debug) {
        switch (code) {
            case 'ArrowUp':
                this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
                this.updateSelectedOption();
                break;
            case 'ArrowDown':
                this.selectedOption = (this.selectedOption + 1) % this.options.length;
                this.updateSelectedOption();
                break;
            case 'Enter':
                this.toggleCurrentOption();
                break;
            case 'Escape':
                // Return to previous scene - handled by SceneManager
                break;
            default:
                break;
        }
    }
}
