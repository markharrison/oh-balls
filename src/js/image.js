export class ImageHandler {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.images = new Map();
    this.loadingPromises = new Map();
  }

  preloadImages() {
    // ...existing code...

    this.preload([
      { url: 'images/smiles.png', name: 'smiles' },
      { url: 'images/ground.png', name: 'ground' },
      { url: 'images/cog.svg', name: 'cog' },
      { url: 'images/xmas/xmas01.png', name: 'xmas01' },
      { url: 'images/xmas/xmas02.png', name: 'xmas02' },
      { url: 'images/xmas/xmas03.png', name: 'xmas03' },
      { url: 'images/xmas/xmas04.png', name: 'xmas04' },
      { url: 'images/xmas/xmas05.png', name: 'xmas05' },
      { url: 'images/xmas/xmas06.png', name: 'xmas06' },
      { url: 'images/xmas/xmas07.png', name: 'xmas07' },
      { url: 'images/xmas/xmas08.png', name: 'xmas08' },
      { url: 'images/xmas/xmas09.png', name: 'xmas09' },
      { url: 'images/xmas/xmas10.png', name: 'xmas10' },
      { url: 'images/xmas/xmas11.png', name: 'xmas11' },
      { url: 'images/xmas/xmas12.png', name: 'xmas12' },
      { url: 'images/xmas/xmas13.png', name: 'xmas13' },
      { url: 'images/xmas/xmas14.png', name: 'xmas14' },
      { url: 'images/xmas/xmas15.png', name: 'xmas15' },
      { url: 'images/xmas/xmas16.png', name: 'xmas16' },
      { url: 'images/xmas/xmas17.png', name: 'xmas17' },
      { url: 'images/xmas/xmas18.png', name: 'xmas18' },
      { url: 'images/xmas/xmas19.png', name: 'xmas19' },
      { url: 'images/xmas/xmas20.png', name: 'xmas20' },
      { url: 'images/xmas/xmas21.png', name: 'xmas21' },
      { url: 'images/xmas/xmas22.png', name: 'xmas22' },
      { url: 'images/xmas/xmas23.png', name: 'xmas23' },
      { url: 'images/xmas/xmas24.png', name: 'xmas24' },
      { url: 'images/xmas/xmas25.png', name: 'xmas25' },
      { url: 'images/xmas/xmas26.png', name: 'xmas26' },
      { url: 'images/xmas/xmas27.png', name: 'xmas27' },
      { url: 'images/xmas/xmas28.png', name: 'xmas28' },
      { url: 'images/xmas/xmas29.png', name: 'xmas29' },
      { url: 'images/xmas/xmas30.png', name: 'xmas30' },
      { url: 'images/xmas/xmas31.png', name: 'xmas31' },
      { url: 'images/xmas/xmas32.png', name: 'xmas32' },
      { url: 'images/xmas/xmas33.png', name: 'xmas33' },
      { url: 'images/xmas/xmas34.png', name: 'xmas34' },
      { url: 'images/xmas/xmas35.png', name: 'xmas35' },
    ]);

    // ...existing code...
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
        // ...existing code...
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
    // ...existing code...

    this.preloadImages();

    // ...existing code...

    // Check status every 100ms
    const checkInterval = setInterval(() => {
      const stats = this.getStats();
      // ...existing code...

      if (stats.loading === 0 && stats.loaded > 0) {
        // ...existing code...
        clearInterval(checkInterval);
      }
    }, 100);

    return 'Function returned immediately while images load in background';
  }
}
