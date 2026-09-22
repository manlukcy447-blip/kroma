import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMacSafari: boolean;
  isDesktop: boolean;
  browserName: string;
  install: () => Promise<boolean>;
  markAsInstalled: () => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  dismissForSession: () => void;
}

const STORAGE_KEY = 'kroma_app_installed_v1';
const SESSION_DISMISSED_KEY = 'kroma_pwa_session_dismissed';

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const stored = localStorage.getItem(STORAGE_KEY) === 'true';
    return isStandalone || stored;
  });

  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [browserName, setBrowserName] = useState('Browser');
  const [showModal, setShowModal] = useState(false);

  // Platform & Browser detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isMac = /macintosh|mac os x/.test(ua) && !isIOSDevice;
    const isSafari = /safari/.test(ua) && !/chrome|chromium|edg|crios|fxios/.test(ua);
    const isMobileDevice = isIOSDevice || isAndroidDevice || /mobile/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMacSafari(isMac && isSafari);
    setIsDesktop(!isMobileDevice);

    if (/edg/.test(ua)) setBrowserName('Edge');
    else if (/chrome|crios/.test(ua)) setBrowserName('Chrome');
    else if (/firefox|fxios/.test(ua)) setBrowserName('Firefox');
    else if (/safari/.test(ua)) setBrowserName('Safari');
    else if (/samsungbrowser/.test(ua)) setBrowserName('Samsung Internet');
    else if (/opera|opr/.test(ua)) setBrowserName('Opera');
    else setBrowserName('Browser');

    // Check standalone mode initially and listen for changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const standalone =
        mediaQuery.matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        localStorage.getItem(STORAGE_KEY) === 'true';
      if (standalone) {
        setIsInstalled(true);
        setShowModal(false);
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch {}
      }
    };
    checkStandalone();

    try {
      mediaQuery.addEventListener('change', checkStandalone);
    } catch {
      mediaQuery.addListener(checkStandalone);
    }

    // Listen for beforeinstallprompt event (Chromium browsers)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // If not yet installed and not dismissed for this session, pop up notification
      const alreadyInstalled = localStorage.getItem(STORAGE_KEY) === 'true';
      const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true';
      if (!alreadyInstalled && !sessionDismissed) {
        // Small delay so user has a smooth entrance into the app
        setTimeout(() => {
          setShowModal(true);
        }, 1200);
      }
    };

    // Listen for appinstalled event (Fires when installation completes successfully)
    const handleAppInstalled = () => {
      console.log('[PWA] Application successfully installed on device');
      setIsInstalled(true);
      setShowModal(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For non-Chromium devices (iOS Safari, Mac Safari, etc. where beforeinstallprompt doesn't fire)
    // Check if we should show the install notification popup
    const alreadyInstalled = localStorage.getItem(STORAGE_KEY) === 'true' || mediaQuery.matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true';

    if (!alreadyInstalled && !sessionDismissed) {
      const timer = setTimeout(() => {
        // Only show if still not marked as installed
        const currentInstalled = localStorage.getItem(STORAGE_KEY) === 'true';
        if (!currentInstalled) {
          setShowModal(true);
        }
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        try {
          mediaQuery.removeEventListener('change', checkStandalone);
        } catch {
          mediaQuery.removeListener(checkStandalone);
        }
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      try {
        mediaQuery.removeEventListener('change', checkStandalone);
      } catch {
        mediaQuery.removeListener(checkStandalone);
      }
    };
  }, []);

  const markAsInstalled = useCallback(() => {
    setIsInstalled(true);
    setShowModal(false);
    setDeferredPrompt(null);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  }, []);

  const dismissForSession = useCallback(() => {
    setShowModal(false);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    } catch {}
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          markAsInstalled();
          return true;
        }
      } catch (err) {
        console.warn('[PWA] Error launching install prompt:', err);
      }
    }
    return false;
  }, [deferredPrompt, markAsInstalled]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isMacSafari,
    isDesktop,
    browserName,
    install,
    markAsInstalled,
    showModal: !isInstalled && showModal,
    setShowModal,
    dismissForSession,
  };
}
