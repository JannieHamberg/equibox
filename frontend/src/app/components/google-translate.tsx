declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: {
          new (config: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          }, element: string): void;
        };
      };
    };
  }
}

'use client';

import { useEffect } from 'react';

export default function GoogleTranslate(): JSX.Element {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = function () {
        try {
          if (window.google?.translate?.TranslateElement) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'sv',
                includedLanguages: 'en,sv',
                autoDisplay: false,
              },
              'google_translate_element'
            );
          }
        } catch (error) {
          console.error('Google Translate initialization error:', error);
        }
      };
    }

    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div 
      id="google_translate_element" 
      className="w-full h-8 bg-white flex items-center justify-end px-8 notranslate"
      translate="no"
      onClick={(e) => e.preventDefault()}
    ></div>
  );
}
