import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'auricapri_terms_consent';
const CURRENT_VERSION = '2024-01';

interface TermsConsent {
  accepted: boolean;
  acceptedAt: string;
  version: string;
  implicit: boolean;
}

export function useTermsConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const consent: TermsConsent = JSON.parse(stored);
        setHasConsented(consent.accepted);
        setShowModal(false);
      } else {
        setHasConsented(false);
        setShowModal(true);
      }
    } catch {
      setHasConsented(false);
      setShowModal(true);
    }
  }, []);

  const acceptTerms = useCallback((implicit = false) => {
    const consent: TermsConsent = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
      implicit
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      // localStorage may be full or unavailable
    }
    setHasConsented(true);
    setShowModal(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return { hasConsented, showModal, acceptTerms, closeModal };
}

// Helper function for order service to save implicit consent
export function saveImplicitTermsConsent() {
  const STORAGE_KEY = 'auricapri_terms_consent';
  const CURRENT_VERSION = '2024-01';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const consent = {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: CURRENT_VERSION,
        implicit: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    }
  } catch {
    // localStorage may be unavailable
  }
}
