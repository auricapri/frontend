import { Locale } from '../../../i18n';
import { LocalizedText, AdminEditableData } from './types';

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getLocVal = (
  obj: LocalizedText | string | null | undefined,
  editLocale: Locale
): string => {
  if (obj === null || obj === undefined) return '';

  // Handle Object (Already parsed or came as object)
  if (typeof obj === 'object') {
    const val = obj[editLocale] || obj['pt'] || obj['en'] || Object.values(obj).find(v => typeof v === 'string' && !!v);
    return typeof val === 'string' ? val : '';
  }

  // Handle String (Possibly JSON)
  if (typeof obj === 'string') {
    if (obj.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(obj);
        return getLocVal(parsed, editLocale);
      } catch {
        return obj;
      }
    }
    return obj;
  }
  return String(obj || '');
};

export const createUpdateNested = (
  itemData: AdminEditableData,
  editLocale: Locale,
  onUpdateData: (newData: AdminEditableData) => void
) => (field: string, value: string | number | boolean | null | undefined) => {
  const newData = { ...itemData } as Record<string, unknown>;

  let currentFieldVal: unknown = newData[field];

  // If it's string JSON, parse it first
  if (typeof currentFieldVal === 'string' && currentFieldVal.startsWith('{')) {
    try {
      currentFieldVal = JSON.parse(currentFieldVal);
    } catch {
      // ignore
    }
  }

  let fieldObject: Record<string, unknown>;

  if (currentFieldVal && typeof currentFieldVal === 'object') {
    fieldObject = currentFieldVal as Record<string, unknown>;
  } else {
    const existingStr = typeof currentFieldVal === 'string' ? currentFieldVal : '';
    fieldObject = { pt: existingStr, en: existingStr, es: '', fr: '' };
  }

  newData[field] = { ...fieldObject, [editLocale]: value };
  onUpdateData(newData as unknown as AdminEditableData);
};

export const createUpdateSimple = (
  itemData: AdminEditableData,
  onUpdateData: (newData: AdminEditableData) => void
) => (field: string, value: string | number | boolean | null | undefined | string[]) => {
  onUpdateData({ ...itemData, [field]: value } as AdminEditableData);
};
