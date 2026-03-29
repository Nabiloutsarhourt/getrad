import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'GETRAD - Interprètes & Traducteurs',
  description: 'Plateforme de mise en relation avec des interprètes et traducteurs professionnels en France',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
