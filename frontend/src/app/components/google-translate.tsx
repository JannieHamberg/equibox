declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google: any; 
  }
}

'use client';

import { useEffect } from 'react';

export default function GoogleTranslate(): JSX.Element {
  useEffect(() => {
    const addScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
      return script;
    };

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'sv',
          includedLanguages: 'en,sv',
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

    const script = addScript();

    return () => {
      document.body.removeChild(script);
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