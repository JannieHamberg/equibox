"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function CookiebotHandler() {
  const pathname = usePathname();
  const [cookiebotLoaded, setCookiebotLoaded] = useState(false);

  useEffect(() => {
    // Inject the Cookiebot script dynamically
    if (!document.getElementById("cookiebot-script")) {
      const script = document.createElement("script");
      script.id = "cookiebot-script";
      script.src = "https://consent.cookiebot.com/uc.js";
      script.setAttribute("data-cbid", "45366a14-7578-40a6-ad76-25195d886373");
      script.setAttribute("data-blockingmode", "auto");
      script.type = "text/javascript";
      document.head.appendChild(script);
      script.onload = () => setCookiebotLoaded(true);
    } else {
      setCookiebotLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Renew Cookiebot only after the script has loaded
    if (cookiebotLoaded && typeof window !== "undefined" && window.Cookiebot) {
      window.Cookiebot.renew();
    }
  }, [pathname, cookiebotLoaded]); // Runs after page transitions

  return null; 
}
