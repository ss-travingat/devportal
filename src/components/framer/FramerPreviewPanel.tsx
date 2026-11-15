'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import FramerPreview from './FramerPreview';

// Devportal-only testing aid — not part of the Framer component itself. The
// Get Featured flow is backed by a real cookie session on app.travingat.com,
// so once you've applied/verified there's no way to re-run the flow from the
// component's own UI (by design). This clears that session and remounts the
// component so QA can go through email -> OTP -> application again.
const APP_URL = 'https://app.travingat.com';

export default function FramerPreviewPanel({
  slug,
  resettable = false,
}: {
  slug: string;
  resettable?: boolean;
}) {
  const [instance, setInstance] = useState(0);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch(`${APP_URL}/api/auth/logout-user`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {
      // best-effort — remount regardless so the local form state resets
    }
    setResetting(false);
    setInstance((n) => n + 1);
  };

  return (
    <div className="w-full">
      {resettable && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700/60 bg-zinc-800/40 text-[12px] text-white/70 hover:text-white hover:bg-zinc-800/70 transition-colors disabled:opacity-50"
            title="Clears the app.travingat.com test session and restarts the flow from the email step"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetting ? 'Resetting...' : 'Reset test session'}
          </button>
        </div>
      )}
      <div className="w-full max-w-[480px] mx-auto">
        <FramerPreview key={instance} slug={slug} />
      </div>
    </div>
  );
}
