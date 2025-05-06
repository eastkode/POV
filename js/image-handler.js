class ImageHandler {
    constructor() {
        this.imageCache = new Map();
        this.defaultImage = 'images/default-thumbnail.jpg';
        this.imageDirectory = 'images/articles/';
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    // Download and cache image
    async downloadImage(url, articleId) {
        try {
            // Check if image is already cached
            if (this.imageCache.has(url)) {
                return this.imageCache.get(url);
            }

            // Create image directory if it doesn't exist
            if (!window.imageHandler) {
                window.imageHandler = this;
            }

            // Get image filename
            const filename = this.getFilenameFromUrl(url, articleId);
            const localPath = `${this.imageDirectory}${filename}`;

            // Try to download the image
            let success = false;
            let attempts = 0;

            while (!success && attempts < this.maxRetries) {
                try {
                    // Use CORS proxy for cross-origin images
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    const imageContent = await fetch(data.contents);
                    const blob = await imageContent.blob();

                    // Create image object to check dimensions
                    const img = new Image();
                    img.src = URL.createObjectURL(blob);
                    
                    // Wait for image to load
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });

                    // Check if image is valid (has dimensions)
                    if (img.width > 0 && img.height > 0) {
                        // Create local image path
                        const localImagePath = this.createLocalImage(blob, filename);
                        
                        // Cache the image
                        this.imageCache.set(url, localImagePath);
                        
                        return localImagePath;
                    } else {
                        throw new Error('Invalid image dimensions');
                    }

                    success = true;
                } catch (error) {
                    attempts++;
                    console.error(`Attempt ${attempts} failed for ${url}:`, error);
                    
                    if (attempts < this.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                    }
                }
            }

            // If all attempts failed, use default image
            if (!success) {
                console.error(`Failed to download image after ${this.maxRetries} attempts: ${url}`);
                return this.defaultImage;
            }

        } catch (error) {
            console.error('Error in downloadImage:', error);
            return this.defaultImage;
        }
    }

    // Get filename from URL
    getFilenameFromUrl(url, articleId) {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const extension = path.split('.').pop();
        return `${articleId}-${Date.now()}.${extension}`;
    }

    // Create local image
    createLocalImage(blob, filename) {
        try {
            // Create a temporary URL for the blob
            const blobUrl = URL.createObjectURL(blob);
            
            // Create image element
            const img = new Image();
            img.src = blobUrl;
            
            // Create canvas to resize image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Wait for image to load
            return new Promise((resolve) => {
                img.onload = () => {
                    // Calculate new dimensions (max width: 800px)
                    const maxWidth = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob
                    canvas.toBlob((newBlob) => {
                        // Create a temporary URL for the new blob
                        const newBlobUrl = URL.createObjectURL(newBlob);
                        
                        // Create image element with new URL
                        const newImg = new Image();
                        newImg.src = newBlobUrl;
                        
                        // Wait for new image to load
                        newImg.onload = () => {
                            // Store in localStorage
                            const imageData = newImg.src;
                            localStorage.setItem(`image_${filename}`, imageData);
                            
                            // Clean up
                            URL.revokeObjectURL(blobUrl);
                            URL.revokeObjectURL(newBlobUrl);
                            
                            resolve(`data:image/jpeg;base64,${imageData}`);
                        };
                    }, 'image/jpeg', 0.8);
                };
            });
        } catch (error) {
            console.error('Error creating local image:', error);
            return this.defaultImage;
        }
    }

    // Load cached image
    loadCachedImage(url) {
        if (this.imageCache.has(url)) {
            return this.imageCache.get(url);
        }
        return null;
    }

    // Clear cache
    clearCache() {
        this.imageCache.clear();
    }
}

// Initialize image handler
const imageHandler = new ImageHandler();
window.imageHandler = imageHandler;

// Add image loading indicator
function addImageLoadingIndicator() {
    const images = document.querySelectorAll('.news-image');
    images.forEach(img => {
        img.classList.add('loading');
        
        // Remove loading class when image loads
        img.addEventListener('load', () => {
            img.classList.remove('loading');
        });
        
        // Add error handling
        img.addEventListener('error', () => {
            img.classList.add('error');
            img.src = imageHandler.defaultImage;
        });
    });
}

// Initialize image loading
window.addEventListener('DOMContentLoaded', () => {
    addImageLoadingIndicator();
});
