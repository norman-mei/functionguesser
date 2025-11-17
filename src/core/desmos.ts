const desmosKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY;
const DESMOS_API_URL = `https://www.desmos.com/api/v1.8/calculator.js?apiKey=${desmosKey ?? ''}`;

declare global {
  interface Window {
    Desmos?: any;
  }
}

let desmosPromise: Promise<any> | null = null;

export const loadDesmosApi = (): Promise<any> => {
  if (!desmosKey) {
    return Promise.reject(new Error('Desmos API key is not configured.'));
  }

  if (window.Desmos) {
    return Promise.resolve(window.Desmos);
  }

  if (!desmosPromise) {
    desmosPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = DESMOS_API_URL;
      script.async = true;
      script.onload = () => resolve(window.Desmos);
      script.onerror = () => reject(new Error('Failed to load Desmos'));
      document.head.appendChild(script);
    });
  }

  return desmosPromise;
};

export const createCalculator = async (
  element: HTMLElement,
  options?: Record<string, unknown>
): Promise<any> => {
  const Desmos = await loadDesmosApi();
  return Desmos.GraphingCalculator(element, {
    expressions: false,
    settingsMenu: false,
    zoomButtons: true,
    keypad: false,
    ...options
  });
};
