export class SceneBase {
    static GameScenes = Object.freeze({
        splash: 'splash',
        mainmenu: 'mainmenu',
        ballsX: 'ballsX',
        settings: 'settings',
        settingsaudio: 'settingsaudio',
    });
    constructor(canvas, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.manager = manager; // Optional: reference to SceneManager if needed
        // Per-instance resize handler used by overlay positioning
        this._resizeHandler = null;
    }

    static createMenuButtons(title = '', containerId, options = [], selectedIndex = 0, onClick = null) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Clear existing
        container.innerHTML = '';

        // Optional title at the top of the menu
        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'menu-title';
            titleEl.textContent = title;
            container.appendChild(titleEl);
        }

        options.forEach((opt, idx) => {
            const label = typeof opt === 'object' && opt !== null ? opt.label ?? String(opt) : String(opt);
            const value = typeof opt === 'object' && opt !== null ? opt.value ?? opt : opt;

            const btn = document.createElement('button');
            btn.className = 'menu-button';
            btn.type = 'button';
            btn.textContent = label;
            btn.dataset.index = String(idx);
            btn.dataset.value = typeof value === 'string' ? value : JSON.stringify(value);

            if (idx === selectedIndex) btn.classList.add('selected');

            btn.addEventListener('click', (e) => {
                // Update selection styling
                SceneBase.setSelectedButton(containerId, idx);
                if (typeof onClick === 'function') onClick(idx, opt);
            });

            // When a button receives keyboard focus (e.g., via Tab), make it the selected button
            btn.addEventListener('focus', (e) => {
                SceneBase.setSelectedButton(containerId, idx);
            });

            container.appendChild(btn);
        });

        return container;
    }

    static setSelectedButton(containerId, index) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const buttons = Array.from(container.querySelectorAll('.menu-button'));
        buttons.forEach((b) => b.classList.remove('selected'));
        const target = buttons[index];
        if (target) target.classList.add('selected');
        // Move DOM focus to the selected button so native keyboard activation works
        try {
            if (target && typeof target.focus === 'function') target.focus();
        } catch (e) {
            // ignore focus errors in older environments
        }
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
                this.setNextScene(0);
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
