/**
 * Image Utilities for Rich Text Editor
 * Uploads through backend for dual-storage (Supabase + R2)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

/**
 * Compress image before upload
 */
export const compressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
  });
};

/**
 * Get auth token for backend requests
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('../../../utils/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Upload image via backend (dual-storage: Supabase + R2)
 */
export const uploadImageToStorage = async (file: File): Promise<string> => {
  try {
    const compressedBlob = await compressImage(file);
    const webpFile = new File([compressedBlob], 'image.webp', { type: 'image/webp' });

    const formData = new FormData();
    formData.append('file', webpFile);
    formData.append('bucket', 'products');
    formData.append('subfolder', 'richtext');

    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/storage/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
