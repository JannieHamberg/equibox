"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

export default function CookieBanner() {
  useEffect(() => {
    CookieConsent.run({
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom center",
          flipButtons: false,
        },
        preferencesModal: {
          layout: "box",
          position: "left",
          flipButtons: false,
        },
      },
      categories: {
        necessary: {
          readOnly: true, // Always enabled
        },
        analytics: {
          autoClear: {
            cookies: [
              {
                name: /^_ga/, // Blocks Google Analytics cookies
              },
            ],
          },
          enabled: true,
        },
        marketing: {
          autoClear: {
            cookies: [
              {
                name: /^_fb/, // Example: Blocks Facebook marketing cookies
              },
              {
                name: /^_gcl/, // Example: Blocks Google Ads conversion cookies
              },
            ],
          },
          enabled: false,
        },
      },
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "We use cookies 🍪",
              description:
                "We use cookies to improve user experience. By clicking accept, you agree to our use of cookies.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Cookie Preferences",
              acceptAllBtn: "Allow all",
              acceptNecessaryBtn: "Allow only necessary",
              savePreferencesBtn: "Save settings",
              sections: [
                {
                  title: "Necessary Cookies",
                  description: "These cookies are required for basic site functionality.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics Cookies",
                  description: "These cookies help us analyze site usage.",
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketing Cookies",
                  description: "These cookies are used for advertising purposes.",
                  linkedCategory: "marketing",
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  return <></>; // No visible component needed
}
