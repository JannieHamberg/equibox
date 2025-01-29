"use client";

import { useEffect } from "react";

export default function CookiebotHandler() {
  useEffect(() => {
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

        // Renew only if consent isn't found
        const hasConsent = document.cookie.includes("_cbconsent");
        if (!hasConsent) {
          console.log("No consent found, renewing Cookiebot");
          window.Cookiebot!.renew();
        } else {
          console.log("Consent already given, skipping renewal");
        }
      };
    }
  }, []); 

  return null;
}
