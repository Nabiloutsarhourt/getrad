import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004ac6] via-[#1a5cd4] to-[#2563eb] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <span className="text-white font-bold text-2xl">GETRAD</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-deep p-6 sm:p-8">
        {children}
      </div>

      <p className="mt-6 text-blue-200 text-sm">
        &copy; {new Date().getFullYear()} GETRAD. Tous droits réservés.
      </p>
    </div>
  );
}
