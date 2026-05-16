import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Reflect the user's theme preference onto <html data-theme="...">.
 * 'system' subscribes to prefers-color-scheme so the page tracks OS changes live.
 */
export function useThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'light' || theme === 'dark') {
      root.dataset.theme = theme;
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      root.dataset.theme = mq.matches ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}
