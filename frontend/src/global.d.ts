export {}; 

declare global {
  interface Window {
    Cookiebot?: {
      renew: () => void;
    };
  }
}
