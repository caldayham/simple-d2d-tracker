'use client';

import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  if (isStandalone || !isIOS) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-blue-50 p-4 border-t border-blue-200 text-center dark:bg-blue-950 dark:border-blue-800">
      <p className="text-sm text-blue-900 dark:text-blue-100">
        Install this app: tap{' '}
        <span className="font-medium">Share</span> then{' '}
        <span className="font-medium">&quot;Add to Home Screen&quot;</span>{' '}
        for reliable recording.
      </p>
    </div>
  );
}
