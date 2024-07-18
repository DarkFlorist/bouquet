const CACHE_SIZE = 100;
export class DataURLCache {
    constructor() {
        this.dataURLs = new Map();
        this.has = (key) => this.dataURLs.has(key);
        this.get = (key) => this.dataURLs.get(key);
        this.set = (image, key) => {
            if (this.dataURLs.size > CACHE_SIZE)
                this.dataURLs.delete(this.dataURLs.keys().next().value);
            this.dataURLs.set(key, image);
            return image;
        };
    }
}
//# sourceMappingURL=DataURLCache.js.map