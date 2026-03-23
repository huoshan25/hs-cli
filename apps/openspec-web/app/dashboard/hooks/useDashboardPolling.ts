import { useEffect } from 'react';

type Params = {
  version: number;
  getVersion: () => Promise<number>;
  refresh: () => Promise<void>;
};

export function useDashboardPolling(params: Params): void {
  const { version, getVersion, refresh } = params;

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const nextVersion = await getVersion();
        if (nextVersion !== version) await refresh();
      } catch {
        // ignore polling error
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [version, getVersion, refresh]);
}

