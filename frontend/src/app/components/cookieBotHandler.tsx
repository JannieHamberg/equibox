"use client";

import { useEffect } from "react";

export default function CookiebotHandler() {
  useEffect(() => {
    // Delay the entire Cookiebot initialization
    setTimeout(() => {
      if (!window.Cookiebot) {
        const script = document.createElement("script");
        script.id = "cookiebot-script";
        script.src = "https://consent.cookiebot.com/uc.js";
        script.setAttribute("data-cbid", "45366a14-7578-40a6-ad76-25195d886373");
        script.setAttribute("data-blockingmode", "auto");
        script.type = "text/javascript";
        document.head.appendChild(script);

        script.onload = () => {
          console.log("Cookiebot loaded");
          
          // Single check for any type of cookie consent interaction
          const hasInteracted = document.cookie.includes('CookieConsent') || 
                              document.cookie.includes('CookieConsentDeclined');
          
          if (!hasInteracted && window.Cookiebot) {
            console.log("No interaction found, showing Cookiebot");
            window.Cookiebot.renew();
          } else {
            console.log("Previous interaction found, skipping Cookiebot dialog");
          }
        };
      }
    }, 2000); // Delay the entire initialization until after page transition
  }, []); 

  return null;
}
