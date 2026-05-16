import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { ToastProvider } from '@/components/ui/Toast';
import { initDatabase } from '@/db/init';
import { useThemeSync } from '@/hooks/useThemeSync';
import { router } from '@/router';

export default function App() {
  const [ready, setReady] = useState(false);
  useThemeSync();

  useEffect(() => {
    initDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🗣️</div>
          <h1 className="text-xl font-bold text-fg">J-Say</h1>
          <p className="text-sm text-fg-muted mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}