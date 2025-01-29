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
import CookiebotHandler from "./components/cookieBotHandler";

const forum = Forum({ 
  weight: '400',
  subsets: ['latin'],
});

const GA_TRACKING_ID = "G-35KT82JBV9";

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
        {/* Google Analytics Script */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={forum.className}>
        <CartProvider>
          <CustomNavbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
          <GoogleTranslate />
          <Minicart />
          <CookiebotHandler /> 
        </CartProvider>
      </body>
    </html>
  );
}
