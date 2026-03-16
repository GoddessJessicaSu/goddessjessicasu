"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-primary mb-4">Something went wrong</h1>
        <p className="text-white/50 mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-primary text-black font-semibold rounded hover:brightness-110 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
