/**
 * File Utilities for FaceSwap Modal
 */

/**
 * Read a file as base64 encoded string
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 */
export const validateImageFile = (
  file: File
): { valid: true } | { valid: false; error: string } => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Por favor, selecione uma imagem válida' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'A imagem deve ter no máximo 10MB' };
  }

  return { valid: true };
};
