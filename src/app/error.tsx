'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
      <span className="text-7xl mb-6">{'\uD83D\uDE34'}</span>
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
