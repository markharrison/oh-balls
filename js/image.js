export class ImageHandler {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.images = new Map();
        this.loadingPromises = new Map();
    }

    preloadImages() {
        console.log('🚀 Starting preload - function should return immediately');
        console.time('preloadImages function');

        this.preload([
            { url: 'images/smiles.png', name: 'smiles' },
            { url: 'images/ground.png', name: 'ground' },
        ]);

        console.timeEnd('preloadImages function');
        console.log('✅ preloadImages returned - images still loading in background');
    }

    async loadImage(url, name = null) {
        const key = name || url;

        if (this.images.has(key)) {
            return this.images.get(key);
        }

        // If image is currently loading, return the existing promise
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        // Start loading the image
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                console.log(`📷 Image loaded: ${url}`);
                this.images.set(key, img);
                this.loadingPromises.delete(key);
                resolve(img);
            };

            img.onerror = () => {
                this.loadingPromises.delete(key);
                reject(new Error(`Failed to load image: ${url}`));
            };

            img.src = url;
        });

        this.loadingPromises.set(key, loadPromise);
        return loadPromise;
    }

    async loadImages(imageConfigs) {
        const promises = imageConfigs.map((config) => this.loadImage(config.url, config.name));
        return Promise.all(promises);
    }

    getImage(key) {
        return this.images.get(key) || null;
    }

    isLoaded(key) {
        return this.images.has(key);
    }

    isLoading(key) {
        return this.loadingPromises.has(key);
    }

    preload(imageConfigs) {
        imageConfigs.forEach((config) => {
            this.loadImage(config.url, config.name).catch((err) => {
                console.warn(`Failed to preload image ${config.url}:`, err);
            });
        });
    }

    clear() {
        this.images.clear();
        this.loadingPromises.clear();
    }

    remove(key) {
        this.images.delete(key);
        this.loadingPromises.delete(key);
    }

    getStats() {
        return {
            loaded: this.images.size,
            loading: this.loadingPromises.size,
        };
    }

    // Test method to prove background loading
    testBackgroundLoading() {
        console.log('🔄 Before preload:', this.getStats());

        this.preloadImages();

        console.log('🔄 Immediately after preload:', this.getStats());

        // Check status every 100ms
        const checkInterval = setInterval(() => {
            const stats = this.getStats();
            console.log('🔄 Status check:', stats);

            if (stats.loading === 0 && stats.loaded > 0) {
                console.log('🎉 All images loaded!');
                clearInterval(checkInterval);
            }
        }, 100);

        return 'Function returned immediately while images load in background';
    }
}
