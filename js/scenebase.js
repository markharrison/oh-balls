export class SceneBase {
    static GameScenes = Object.freeze({
        splash: 'splash',
        mainmenu: 'mainmenu',
        ballsX: 'ballsX',
        settings: 'settings',
        settingsaudio: 'settingsaudio',
    });
    constructor(canvas, manager, config = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.manager = manager;
        this.config = config;
        this.selectedOption = 1;
        this.menuOptionsCount = 0;
        this._resizeHandler = null;
    }

    addMenuButton(title, idx) {
        var butContainer = document.getElementById('idButtonContainer');
        if (!butContainer) {
            // alert('Target container #idButtonContainer not found');
            return;
        }

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary';
        button.textContent = title;
        button.id = 'idMenuButton_' + idx;

        button.dataset.idx = String(idx);

        button._onClick = (e) => {
            var btn = e.currentTarget || button;
            this.selectedOption = Number(btn.dataset.idx);
            if (typeof this.doMenuHandler === 'function') {
                this.doMenuHandler(this.selectedOption);
            }
        };

        button.addEventListener('click', button._onClick);

        butContainer.appendChild(button);
    }

    addMenuButtons(menuOptions) {
        menuOptions.forEach((menuOption, index) => {
            this.addMenuButton(menuOption, index + 1);
        });
        this.menuOptionsCount = menuOptions.length;
    }

    selectMenuButton(opt) {
        this.selectedOption = opt;

        const btn = document.getElementById('idMenuButton_' + opt);

        if (btn) btn.focus();
    }

    deleteMenuEventListeners() {
        const butContainer = document.getElementById('idButtonContainer');
        if (!butContainer) return;

        const buttons = Array.from(butContainer.querySelectorAll('button'));
        buttons.forEach((btn) => {
            if (btn._onClick) {
                btn.removeEventListener('click', btn._onClick);
                btn._onClick = null;
            }
        });
    }

    enter() {
        // Called when the scene becomes active
    }

    exit() {
        // Called when the scene is deactivated
    }

    update(dt) {
        // Called every tick; return string (scene key) to request transition
        // Return null/undefined to stay in this scene
        return null;
    }

    render(ctx) {}

    getSceneStateHtml() {
        return '';
    }

    getSpecialKeys() {
        return ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'Control+KeyD'];
    }

    inputKeyPressed(comboId) {
        switch (comboId) {
            case 'ArrowUp':
                if (this.selectedOption > 1) {
                    this.selectedOption = this.selectedOption - 1;
                    this.selectMenuButton(this.selectedOption);
                }
                break;
            case 'ArrowDown':
                if (this.selectedOption < 2) {
                    this.selectedOption = this.selectedOption + 1;
                    this.selectMenuButton(this.selectedOption);
                }
                break;
            case 'Enter':
                this.doMenuHandler(this.selectedOption);
                break;
            case 'Escape':
                this.doMenuHandler(1);
                break;
            default:
                this.inputKeyPressedOther(comboId);
                break;
        }
    }

    // Subclasses can override this to handle other keys
    inputKeyPressedOther(comboId) {}

    // Overlay lifecycle helpers - subclasses provide insertHTMLOverlayContent()
    showOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        // Subclass is expected to populate overlay HTML
        if (typeof this.insertHTMLOverlayContent === 'function') {
            this.insertHTMLOverlayContent();
        }
        this.updateCanvasOverlayPosition();
        overlay.style.display = 'block';
        // Focus selected button if the scene has one
        setTimeout(() => {
            if (this.menuContainerId && typeof SceneBase.setSelectedButton === 'function') {
                const sel = typeof this.selectedOption === 'number' ? this.selectedOption : 0;
                SceneBase.setSelectedButton(this.menuContainerId, sel);
            }
        }, 0);

        if (!this._resizeHandler) {
            this._resizeHandler = () => {
                if (overlay.style.display === 'block') {
                    this.updateCanvasOverlayPosition();
                }
            };
            window.addEventListener('resize', this._resizeHandler);
        }
    }

    hideOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        overlay.style.display = 'none';
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }

    updateCanvasOverlayPosition() {
        const canvasEl = document.getElementById('idCanvas') || this.canvas;
        const overlay = document.getElementById('idCanvasOverlay');
        if (!canvasEl || !overlay) return;
        const rect = canvasEl.getBoundingClientRect();
        overlay.style.position = 'absolute';
        overlay.style.left = rect.left + window.scrollX + 'px';
        overlay.style.top = rect.top + window.scrollY + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.pointerEvents = 'auto';
        overlay.style.zIndex = '100';
    }
}
