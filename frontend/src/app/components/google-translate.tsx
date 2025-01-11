'use client';

import { useEffect } from 'react';


declare global {
  interface Window {
    google: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    const addScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'sv',
          includedLanguages: 'en,sv',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );

      // Prevent scroll and fix dropdown position
      const observer = new MutationObserver(() => {
        const dropdown = document.querySelector('.goog-te-menu-frame');
        if (dropdown) {
          dropdown.addEventListener('load', () => {
            const doc = (dropdown as HTMLIFrameElement).contentDocument || (dropdown as HTMLIFrameElement).contentWindow?.document;
            if (doc) {
              doc.body.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
              });
            }
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    };

    addScript();

    return () => {
      delete window.googleTranslateElementInit;
    };
  }, []);

  return (
    <div 
      id="google_translate_element" 
      className="w-full h-8 bg-white flex items-center justify-end px-8"
      onClick={(e) => e.preventDefault()}
    ></div>
  );
} 