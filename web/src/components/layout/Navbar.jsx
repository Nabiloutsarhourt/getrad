'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Briefcase, MessageSquare, User, LayoutDashboard,
  Calendar, ShieldCheck, Users, CreditCard, X, CheckSquare, CalendarClock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';
import Avatar from '../ui/Avatar';

const CLIENT_LINKS = [
  { href: '/client/home', label: 'Accueil', icon: Home },
  { href: '/client/interpreters', label: 'Interprètes', icon: Search },
  { href: '/client/missions', label: 'Mes missions', icon: Briefcase },
  { href: '/client/messages', label: 'Messages', icon: MessageSquare },
  { href: '/client/profile', label: 'Profil', icon: User },
];

const INTERPRETER_LINKS = [
  { href: '/interpreter/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/interpreter/bookings', label: 'Réservations', icon: Calendar },
  { href: '/interpreter/availability', label: 'Disponibilités', icon: CalendarClock },
  { href: '/interpreter/messages', label: 'Messages', icon: MessageSquare },
  { href: '/interpreter/profile', label: 'Profil', icon: User },
  { href: '/interpreter/subscription', label: 'Abonnement', icon: CreditCard },
  { href: '/interpreter/verification', label: 'Vérification', icon: ShieldCheck },
];

const ADMIN_LINKS = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Vérifications', icon: CheckSquare },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
];

export default function Navbar({ role, open, onClose }) {
  const pathname = usePathname();
  const { userData } = useAuth();

  const links = role === 'admin' ? ADMIN_LINKS : role === 'interpreter' ? INTERPRETER_LINKS : CLIENT_LINKS;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-white border-r border-[#c3c6d7] z-40
          flex flex-col shadow-card
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#c3c6d7]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-lg text-[#191c1d]">GETRAD</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 text-[#737686]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150
                      ${isActive
                        ? 'bg-[#dbe1ff] text-[#004ac6]'
                        : 'text-[#434655] hover:bg-[#f3f4f5] hover:text-[#191c1d]'
                      }
                    `}
                  >
                    <Icon size={18} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info + logout */}
        <div className="border-t border-[#c3c6d7] p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              name={userData?.displayName}
              photoURL={userData?.photoURL}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191c1d] truncate">
                {userData?.displayName || 'Utilisateur'}
              </p>
              <p className="text-xs text-[#737686] truncate">{userData?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-[#737686] hover:text-[#ba1a1a] px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
