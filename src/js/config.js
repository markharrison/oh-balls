export class ConfigManager {
    constructor(objectHandler) {
        // Default configuration values
        this._config = {
            AudioEnabled: true,
            MasterVolume: 80,
            MusicVolume: 80,
            SfxVolume: 80,
            Theme: 'default',
            UserName: '',
            UserId: '',
            GameSize: 'Large',
            Dev: false,
            HighestScores: [], // Array of { GameType, Score }
        };

        this.objectHandler = objectHandler;
        this.loadFromLocalStorage();
    }

    // HighestScores methods
    setHighestScore(gameType, score) {
        if (!gameType) return;
        score = Number(score) || 0;
        const idx = this._config.HighestScores.findIndex((hs) => hs.GameType === gameType);
        if (idx >= 0) {
            this._config.HighestScores[idx].Score = score;
        } else {
            this._config.HighestScores.push({ GameType: gameType, Score: score });
        }
    }

    getHighestScore(gameType) {
        if (!gameType) return 0;
        const found = this._config.HighestScores.find((hs) => hs.GameType === gameType);
        return found ? found.Score : 0;
    }
    // Audio getter/setter
    get audioEnabled() {
        return this._config.AudioEnabled;
    }

    set audioEnabled(value) {
        this._config.AudioEnabled = Boolean(value);
    }

    // Master/Music/SFX volume getters/setters (0-100)
    get masterVolume() {
        return this._config.MasterVolume;
    }

    set masterVolume(value) {
        const numValue = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        this._config.MasterVolume = numValue;
    }

    get musicVolume() {
        return this._config.MusicVolume;
    }

    set musicVolume(value) {
        const numValue = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        this._config.MusicVolume = numValue;
    }

    get sfxVolume() {
        return this._config.SfxVolume;
    }

    set sfxVolume(value) {
        const numValue = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        this._config.SfxVolume = numValue;
    }

    // Theme getter/setter
    get theme() {
        return this._config.Theme;
    }

    set theme(value) {
        this._config.Theme = String(value);
    }

    // User Name getter/setter
    get userName() {
        return this._config.UserName;
    }

    set userName(value) {
        this._config.UserName = String(value);
    }

    // User ID getter/setter
    get userId() {
        return this._config.UserId;
    }

    set userId(value) {
        this._config.UserId = String(value);
    }

    // gameSize getter/setter
    get gameSize() {
        return this._config.GameSize;
    }

    set gameSize(value) {
        const validSizes = ['Small', 'Medium', 'Large'];
        if (validSizes.includes(value)) {
            this._config.GameSize = value;
        } else {
            this._config.GameSize = 'Large';
        }
    }

    get dev() {
        return this._config.Dev;
    }

    set dev(value) {
        this._config.Dev = Boolean(value);
    }

    // DevPanel getter/setter
    get devPanel() {
        return this._config.DevPanel;
    }

    set devPanel(value) {
        this._config.DevPanel = Boolean(value);
    }

    serialize() {
        return JSON.stringify(this._config);
    }

    deserialize(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (data.hasOwnProperty('AudioEnabled')) {
                this.audioEnabled = data.AudioEnabled;
            }
            if (data.hasOwnProperty('MasterVolume')) {
                this.masterVolume = data.MasterVolume;
            }
            if (data.hasOwnProperty('MusicVolume')) {
                this.musicVolume = data.MusicVolume;
            }
            if (data.hasOwnProperty('SfxVolume')) {
                this.sfxVolume = data.SfxVolume;
            }
            if (data.hasOwnProperty('Theme')) {
                this.theme = data.Theme;
            }
            if (data.hasOwnProperty('UserName')) {
                this.userName = data.UserName;
            }
            if (data.hasOwnProperty('UserId')) {
                this.userId = data.UserId;
            }
            if (data.hasOwnProperty('GameSize')) {
                this.gameSize = data.GameSize;
            }
            if (data.hasOwnProperty('Dev')) {
                this.dev = data.Dev;
            }
            if (data.hasOwnProperty('DevPanel')) {
                this.devPanel = data.DevPanel;
            }
            if (Array.isArray(data.HighestScores)) {
                this._config.HighestScores = data.HighestScores.map((hs) => ({
                    GameType: String(hs.GameType),
                    Score: Number(hs.Score) || 0,
                }));
            }
        } catch (error) {
            throw new Error('Invalid JSON string provided for deserialization: ' + error.message);
        }
    }

    // Get all configuration as a plain object (useful for debugging)
    getAll() {
        return { ...this._config };
    }

    // Reset to default values
    reset() {
        this._config = {
            AudioEnabled: true,
            MasterVolume: 80,
            MusicVolume: 80,
            SfxVolume: 80,
            Theme: 'default',
            UserName: '',
            UserId: '',
            GameSize: 'Large',
            Dev: false,
            DevPanel: false,
            HighestScores: [],
        };
    }

    // Save to localStorage (convenience method)
    saveToLocalStorage(key = 'oh-balls-merge-config') {
        localStorage.setItem(key, this.serialize());
    }

    // Load from localStorage (convenience method)
    loadFromLocalStorage(key = 'oh-balls-merge-config') {
        const stored = localStorage.getItem(key);
        if (stored) {
            this.deserialize(stored);
            return true;
        }
        return false;
    }
}
