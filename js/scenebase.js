export class SceneBase {
    static GameScenes = Object.freeze({
        splash: 'splash',
        mainmenu: 'mainmenu',
        ballsX: 'ballsX',
        settings: 'settings',
        settingsaudio: 'settingsaudio',
        settingsgameplay: 'settingsgameplay',
        settingsdeveloper: 'settingsdeveloper',
    });
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.configManager = objectManager.get('ConfigManager');
        this.sceneManager = objectManager.get('SceneManager');
        this.canvas = objectManager.get('Main').canvas;
        this.ctx = this.canvas.getContext('2d');

        this.selectedOption = 1;
        this.menuOptionsCount = 0;
    }

    addMenuButton(title, idx) {
        var butContainer = document.getElementById('idButtonContainer');
        if (!butContainer) {
            return;
        }

        var but = document.createElement('button');
        but.type = 'button';
        but.className = 'btn btn-primary';
        but.textContent = title;
        but.id = 'idMenuButton_' + idx;
        but.setAttribute('tabindex', '0');

        but.dataset.idx = String(idx);

        but._onClick = (e) => {
            var btn = e.currentTarget || but;
            this.selectedOption = Number(btn.dataset.idx);
            if (typeof this.doMenuHandler === 'function') {
                this.doMenuHandler(this.selectedOption);
            }
        };

        but.addEventListener('click', but._onClick);

        butContainer.appendChild(but);
    }

    addMenuButtons(menuOptions) {
        menuOptions.forEach((menuOption, index) => {
            this.addMenuButton(menuOption, index + 1);
        });
        this.menuOptionsCount = menuOptions.length;

        setTimeout(() => {
            this.selectMenuButton(1);
        }, 30);
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

    enter() {}

    exit() {}

    updateFrame() {
        return null;
    }

    getSceneStateHtml() {
        return '';
    }

    getFocusedMenuButtonIndex() {
        const active = document.activeElement;
        if (active && active.id && active.id.startsWith('idMenuButton_')) {
            return Number(active.dataset.idx);
        }
        return 1;
    }

    getSpecialKeys() {
        return ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'Control+KeyP', 'Control+KeyD'];
    }

    inputKeyPressed(comboId) {
        if (this.menuOptionsCount > 0) {
            this.selectedOption = this.getFocusedMenuButtonIndex();

            switch (comboId) {
                case 'ArrowUp':
                    if (this.selectedOption > 1) {
                        this.selectedOption = this.selectedOption - 1;
                        this.selectMenuButton(this.selectedOption);
                    }
                    break;
                case 'ArrowDown':
                    if (this.selectedOption < this.menuOptionsCount) {
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
        } else {
            this.inputKeyPressedOther(comboId);
        }
    }

    inputKeyPressedOther(comboId) {}

    showOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;

        if (typeof this.insertHTMLOverlayContent === 'function') {
            this.insertHTMLOverlayContent();
        }

        overlay.style.display = 'block';

        this.sceneManager.doShowOverlay();

        setTimeout(() => {
            this.selectMenuButton(1);
        }, 5);
    }

    hideOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (!overlay) return;
        overlay.style.display = 'none';

        this.sceneManager.doHideOverlay();
    }
}
