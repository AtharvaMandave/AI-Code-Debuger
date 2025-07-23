import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function DebugPage() {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
          {/* Navbar */}
          {/* ... rest of your page ... */}
        </div>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-8 rounded-xl shadow-xl flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Sign in to use the Debugger</h2>
            <SignInButton mode="modal">
              <button className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-lg shadow hover:scale-105 hover:shadow-2xl transition-all duration-200">Sign In</button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </>
  );
} 