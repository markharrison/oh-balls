export class ConfigManager {
    constructor(objectHandler) {
        // Default configuration values
        this._config = {
            audioEnabled: true,
            masterVolume: 80,
            musicVolume: 80,
            sfxVolume: 80,
            theme: 'default',
            userName: '',
            userId: '',
        };

        this.objectHandler = objectHandler;
        this.loadFromLocalStorage();
    }

    // Audio getter/setter
    get audioEnabled() {
        return this._config.audioEnabled;
    }

    set audioEnabled(value) {
        this._config.audioEnabled = Boolean(value);
    }

    // Master/Music/SFX volume getters/setters (0-100)
    get masterVolume() {
        return this._config.masterVolume;
    }

    set masterVolume(value) {
        const numValue = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        this._config.masterVolume = numValue;
    }

    get musicVolume() {
        return this._config.musicVolume;
    }

    set musicVolume(value) {
        const numValue = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        this._config.musicVolume = numValue;
    }

    get sfxVolume() {
        return this._config.sfxVolume;
    }

    set sfxVolume(value) {
        const numValue = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        this._config.sfxVolume = numValue;
    }

    // Theme getter/setter
    get theme() {
        return this._config.theme;
    }

    set theme(value) {
        this._config.theme = String(value);
    }

    // User Name getter/setter
    get userName() {
        return this._config.userName;
    }

    set userName(value) {
        this._config.userName = String(value);
    }

    // User ID getter/setter
    get userId() {
        return this._config.userId;
    }

    set userId(value) {
        this._config.userId = String(value);
    }

    // Serialize all configuration to JSON string
    serialize() {
        return JSON.stringify(this._config);
    }

    // Deserialize JSON string and update configuration
    deserialize(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate and set each property using setters for validation
            if (data.hasOwnProperty('audio')) {
                this.audioEnabled = data.audioEnabled;
            }
            if (data.hasOwnProperty('masterVolume')) {
                this.masterVolume = data.masterVolume;
            }
            if (data.hasOwnProperty('musicVolume')) {
                this.musicVolume = data.musicVolume;
            }
            if (data.hasOwnProperty('sfxVolume')) {
                this.sfxVolume = data.sfxVolume;
            }
            if (data.hasOwnProperty('theme')) {
                this.theme = data.theme;
            }
            if (data.hasOwnProperty('userName')) {
                this.userName = data.userName;
            }
            if (data.hasOwnProperty('userId')) {
                this.userId = data.userId;
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
            audioEnabled: true,
            masterVolume: 80,
            musicVolume: 80,
            sfxVolume: 80,
            theme: 'default',
            userName: '',
            userId: '',
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
