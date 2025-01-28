import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import  CustomNavbar from './components/navbar/navbar';
import Footer from "./components/footer";
import PageTransition from "./page-transition";
import GoogleTranslate from './components/google-translate';
import { CartProvider } from './context/CartContext';

const inter = Inter({ subsets: ["latin"] });

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body className={inter.className}>
        <CartProvider>
          <CustomNavbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
          <GoogleTranslate />
        </CartProvider>
      </body>
    </html>
  );
}
