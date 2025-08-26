// Input Handling Module
export class InputHandler {
    constructor(main) {
        this.main = main;

        this.sceneManager = null;
        const startTime = Date.now();
        const getSceneManager = () => {
            if (this.main.sceneManager) {
                this.sceneManager = this.main.sceneManager;
            } else {
                if (Date.now() - startTime > 50000) {
                    alert('sceneManager not created after 5 seconds');
                    return;
                }
                setTimeout(getSceneManager, 20);
            }
        };
        getSceneManager();

        this.keyState = {};
        this.gamepadState = {};

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    buildKeyId(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Control');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        if (event.metaKey) parts.push('Meta');
        parts.push(event.code);
        return parts.join('+');
    }

    handleKeyDownOverlay(event) {
        const combo = this.buildKeyId(event);
        const keyId = event.code;

        let specialKeys = this.sceneManager.getSpecialKeys();

        if (specialKeys.includes(combo)) {
            event.preventDefault();
            if (!this.keyState[keyId]) {
                this.keyState[keyId] = true;
                this.sceneManager.inputKeyPressed(combo);
                // if (this.sceneManager && typeof this.sceneManager.inputKeyPressed === 'function') {
                //     this.sceneManager.inputKeyPressed(combo);
                // }
            }
        }
    }

    handleKeyDownDialog(event) {
        const combo = this.buildKeyId(event);
        const keyId = event.code;

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(combo)) {
            event.preventDefault();
        }

        if (!this.keyState[keyId]) {
            this.keyState[keyId] = true;
            this.sceneManager.doDialogInputKeyPressed(combo);
        }
    }

    handleKeyDownCanvas(event) {
        const combo = this.buildKeyId(event);
        const keyId = event.code;

        if (
            [
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
                'Space',
                'Enter',
                'Escape',
                'Control+KeyD',
                'Control+KeyA',
            ].includes(combo)
        ) {
            event.preventDefault();
        }

        // Arrow keys: just set state, repeat handled in getInput
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'KeyA' || event.code === 'KeyD') {
            this.keyState[keyId] = true;
            return;
        }

        if (!this.keyState[keyId]) {
            this.keyState[keyId] = true;
            this.sceneManager.inputKeyPressed(combo);
            // if (this.sceneManager && typeof this.sceneManager.inputKeyPressed === 'function') {
            //     this.sceneManager.inputKeyPressed(combo);
            // }
        }
    }

    handleKeyDown(event) {
        const dialogVisible = this.sceneManager.dialogEnabled;
        const overlayVisible = this.sceneManager.overlayEnabled;

        if (dialogVisible) {
            this.handleKeyDownDialog(event);
        } else if (overlayVisible) {
            this.handleKeyDownOverlay(event);
        } else {
            this.handleKeyDownCanvas(event);
        }
    }

    handleKeyUp(event) {
        const keyId = event.code;
        this.keyState[keyId] = false;
    }

    getInput() {
        if (!this.sceneManager) return;

        const dialogVisible = this.sceneManager.dialogEnabled;
        const overlayVisible = this.sceneManager.overlayEnabled;

        if (!overlayVisible && !dialogVisible) {
            if (this.keyState['ArrowLeft'] || this.keyState['KeyA']) {
                this.sceneManager.inputKeyPressed('ArrowLeft');
            } else if (this.keyState['ArrowRight'] || this.keyState['KeyD']) {
                this.sceneManager.inputKeyPressed('ArrowRight');
            }
        }

        // Gamepad polling
        this.pollGamepad();
    }

    pollGamepad() {
        const processButton = (buttonName, callback) => {
            const idx = buttonIndexMap[buttonName];
            if (gp.buttons[idx]?.pressed) {
                if (!this.gamepadState[buttonName]) {
                    this.gamepadState[buttonName] = true;
                    callback();
                }
            } else {
                this.gamepadState[buttonName] = false;
            }
        };

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp) return;

        const buttonIndexMap = {
            'Button A': 0,
            'Button B': 1,
            'Button X': 2,
            'Button Y': 3,
            'Left Bumper': 4,
            'Right Bumper': 5,
            'Left Trigger': 6,
            'Right Trigger': 7,
            'Button Back': 8,
            'Button Start': 9,
            'Button Left Stick': 10,
            'Button Right Stick': 11,
            'D-pad Up': 12,
            'D-pad Down': 13,
            'D-pad Left': 14,
            'D-pad Right': 15,
            'Home / Guide / PS': 16,
        };

        const dialogVisible = this.sceneManager.dialogEnabled;
        const overlayVisible = this.sceneManager.overlayEnabled;
        const gameMode = !(dialogVisible || overlayVisible);

        // Helper to process D-pad button with a callback

        // Left thumbstick X axis for left/right auto-repeat
        const axisX = gp.axes[0] || 0;
        const deadZone = 0.3;
        if (axisX < -deadZone) {
            this.sceneManager.inputKeyPressed('ArrowLeft');
        } else if (axisX > deadZone) {
            this.sceneManager.inputKeyPressed('ArrowRight');
        }

        processButton('D-pad Up', () => {
            this.sceneManager.inputKeyPressed('ArrowUp');
        });
        processButton('D-pad Down', () => {
            this.sceneManager.inputKeyPressed(gameMode ? 'Space' : 'ArrowDown');
        });
        processButton('D-pad Left', () => {
            this.sceneManager.inputKeyPressed('ArrowLeft');
            if (gameMode) {
                this.gamepadState['D-pad Left'] = false;
            }
        });
        processButton('D-pad Right', () => {
            this.sceneManager.inputKeyPressed('ArrowRight');
            if (gameMode) {
                this.gamepadState['D-pad Right'] = false;
            }
        });
        processButton('Button A', () => {
            this.sceneManager.inputKeyPressed(gameMode ? 'Space' : 'Enter');
        });

        processButton('Button B', () => {
            this.sceneManager.inputKeyPressed('Escape');
        });
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}
