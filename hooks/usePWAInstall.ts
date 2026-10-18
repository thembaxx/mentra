'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker for offline support & PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => setSwRegistered(true))
        .catch(() => {
          // Service worker registration optional in restricted iframe contexts
        });
    }

    // Detect standalone mode (already installed)
    const mediaStandalone = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const standalone =
        mediaStandalone.matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };
    checkStandalone();
    mediaStandalone.addEventListener('change', checkStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaStandalone.removeEventListener('change', checkStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    swRegistered,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useNativeCapabilities() {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);

  const triggerHaptic = useCallback((pattern: number | number[] = 12) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported desktop browsers
      }
    }
  }, []);

  const shareStudyProgress = useCallback(
    async (title: string, text: string): Promise<'shared' | 'copied'> => {
      const shareData = {
        title,
        text,
        url: typeof window !== 'undefined' ? window.location.href : '',
      };

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share(shareData);
          return 'shared';
        } catch {
          // Fallback to clipboard copy
        }
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${title} — ${text} ${shareData.url}`);
      }
      return 'copied';
    },
    []
  );

  const toggleFocusWakeLock = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      const next = !wakeLockActive;
      setWakeLockActive(next);
      return next;
    }

    try {
      if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        setWakeLockActive(false);
        return false;
      } else {
        const sentinel = await navigator.wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        setWakeLockActive(true);
        sentinel.addEventListener('release', () => {
          setWakeLockActive(false);
          setWakeLockSentinel(null);
        });
        return true;
      }
    } catch {
      const next = !wakeLockActive;
      setWakeLockActive(next);
      return next;
    }
  }, [wakeLockActive, wakeLockSentinel]);

  return {
    triggerHaptic,
    shareStudyProgress,
    wakeLockActive,
    toggleFocusWakeLock,
  };
}
