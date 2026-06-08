'use client';

import { useEffect } from 'react';
import { runBackgroundSync } from '@/lib/sync/backgroundSync';

export function AutoSync() {
  useEffect(() => {
    runBackgroundSync();

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') runBackgroundSync();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return null;
}
