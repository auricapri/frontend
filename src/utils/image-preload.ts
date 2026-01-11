import { getOptimizedImageUrl } from './image';

export async function preloadCriticalImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimizedImageUrl(url, 'large', { quality: 85 });
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${url}`));
      };
      img.src = link.href;
    });
  });
  
  return Promise.all(promises).then(() => undefined);
}

export async function preloadImagesProgressive(urls: string[], batchSize: number = 3): Promise<void> {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(url => {
        const img = new Image();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = getOptimizedImageUrl(url, 'medium', { quality: 80 });
        });
      })
    );
    
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

export function preloadImageOnHover(url: string, size: 'medium' | 'large' = 'medium'): void {
  const img = new Image();
  img.src = getOptimizedImageUrl(url, size, { quality: 85 });
}
