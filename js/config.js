export class Config {
    constructor() {
        // Default configuration values
        this._config = {
            audio: true,
            volume: 25,
            theme: 'default',
            userName: '',
            userId: '',
        };
    }

    // Audio getter/setter
    get audio() {
        return this._config.audio;
    }

    set audio(value) {
        this._config.audio = Boolean(value);
    }

    // Volume getter/setter (0-100)
    get volume() {
        return this._config.volume;
    }

    set volume(value) {
        const numValue = parseInt(value, 10);
        this._config.volume = numValue;
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
                this.audio = data.audio;
            }
            if (data.hasOwnProperty('volume')) {
                this.volume = data.volume;
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
            audio: true,
            volume: 80,
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
