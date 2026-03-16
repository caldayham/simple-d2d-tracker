'use client';

interface AddressDisplayProps {
  address: string | null;
  isResolving: boolean;
}

export default function AddressDisplay({
  address,
  isResolving,
}: AddressDisplayProps) {
  if (!address && !isResolving) return null;

  if (isResolving) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Resolving address...</span>
      </div>
    );
  }

  return (
    <p className="text-sm text-zinc-700 dark:text-zinc-300 text-center px-4">
      {address}
    </p>
  );
}
