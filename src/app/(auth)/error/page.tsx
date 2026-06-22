import Link from "next/link";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link is no longer valid.",
  Default: "An unexpected error occurred during sign in.",
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = error ? (MESSAGES[error] ?? MESSAGES.Default) : MESSAGES.Default;

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>

      <h1 className="text-lg font-semibold text-stone-900 mb-2">
        Sign-in error
      </h1>
      <p className="text-sm text-stone-500 mb-6">{message}</p>

      <Link
        href="/signin"
        className="inline-block rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-5 py-2.5 transition"
      >
        Back to sign in
      </Link>
    </div>
  );
}
