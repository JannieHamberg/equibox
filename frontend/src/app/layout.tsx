import type { Metadata } from "next";
import PageTransition from "./page-transition";
import { Forum } from "next/font/google";
import Script from "next/script"; 
import "./globals.css";
import  CustomNavbar from './components/navbar/navbar';
import Footer from "./components/footer";
import GoogleTranslate from './components/google-translate';
import { CartProvider } from './context/CartContext';
import Minicart from "./minicart/components/minicart";
import CookieBanner from "./components/cookieConsent";

const forum = Forum({ 
  weight: '400',
  subsets: ['latin'],
});

/* const GA_TRACKING_ID = "G-35KT82JBV9"; */

export const metadata: Metadata = {
  title: "Equibox - Prenumerationsbox för häst & ryttare",
  description: "Upptäck nya produkter för dig och din häst varje säsong",
  icons: {
    icon: [
      {
        url: "/favicon-logo/favicon1/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon-logo/favicon1/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
  },
  appleWebApp: {
    title: "Equibox",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="sv">
            <head>
                {/* Push user_type to dataLayer BEFORE GTM loads */}
        <Script
          id="user-type-tracking"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                'event': 'userTypeDefined',
                'user_type': (function() {
                  if (typeof window !== 'undefined' && window.isAdmin) {
                    return 'admin';
                  } else if (typeof window !== 'undefined' && window.isLoggedIn) {
                    return 'logged_in';
                  } else {
                    return 'guest';
                  }
                })()
              });
            `,
          }}
        />

        {/* Google Tag Manager (GTM) */}
        <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id=GTM-TBL88R8F'+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TBL88R8F');
          `,
        }}
      />
      </head>

      <body className={forum.className}>
     {/*  <!-- Google Tag Manager (noscript) --> */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-TBL88R8F"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
    </noscript>

      {/* <!-- End Google Tag Manager (noscript) --> */}
        <CartProvider>
          <CustomNavbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
          <GoogleTranslate />
          <Minicart />
            <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
