import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContext';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: {
    default: 'GETRAD — Interprètes & Traducteurs en France',
    template: '%s — GETRAD',
  },
  description: 'Plateforme de mise en relation avec des interprètes et traducteurs professionnels en France. Réservation instantanée, profils vérifiés, 50+ langues.',
  keywords: ['interprète', 'traducteur', 'interprétation', 'traduction', 'France', 'professionnel'],
  openGraph: {
    title: 'GETRAD — Interprètes & Traducteurs en France',
    description: 'Trouvez votre interprète professionnel en quelques clics. Profils vérifiés, disponibilité immédiate.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'GETRAD',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.className}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
