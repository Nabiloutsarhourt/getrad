'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';
import { Globe, Clock, Shield, Star, Search, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loading, isClient, isInterpreter, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin) router.push('/admin/dashboard');
      else if (isInterpreter) router.push('/interpreter/dashboard');
      else router.push('/client/home');
    }
  }, [loading, isAuthenticated, isAdmin, isInterpreter, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#e7e8e9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-xl text-[#191c1d]">GETRAD</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#434655] hover:text-[#004ac6] transition-colors px-3 py-2"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-[#004ac6] text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#004ac6] via-[#1a5cd4] to-[#2563eb] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-sm mb-6">
              <span className="w-2 h-2 bg-[#6cf8bb] rounded-full" />
              <span>Plateforme professionnelle d&apos;interprétation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Trouvez votre interprète en quelques clics
            </h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              GETRAD connecte clients et professionnels de l&apos;interprétation et de la traduction en France. Disponibilité immédiate, tarifs transparents, vérification des profils.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#004ac6] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Commencer gratuitement
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#004ac6] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-3 gap-4 divide-x divide-white/20">
          {[
            { value: '500+', label: 'Interprètes' },
            { value: '50+', label: 'Langues' },
            { value: '1 000+', label: 'Missions réalisées' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center px-4">
              <div className="text-2xl sm:text-3xl font-bold">{value}</div>
              <div className="text-sm text-blue-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#191c1d] mb-3">Comment ça fonctionne</h2>
          <p className="text-[#434655]">Simple, rapide et fiable</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', icon: Search, title: 'Recherchez', desc: 'Parcourez notre annuaire d\'interprètes vérifiés selon vos critères (langue, spécialité, ville).' },
            { step: '2', icon: MessageSquare, title: 'Contactez', desc: 'Envoyez une demande de mission ou réservez directement auprès du prestataire.' },
            { step: '3', icon: Clock, title: 'Confirmez', desc: 'L\'interprète accepte votre demande en quelques minutes grâce à notre système temps réel.' },
            { step: '4', icon: CheckCircle, title: 'Mission réussie', desc: 'Réalisez votre mission et laissez un avis pour améliorer la communauté.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative bg-white border border-[#e7e8e9] rounded-2xl p-6 shadow-card">
              <div className="w-10 h-10 bg-[#dbe1ff] text-[#004ac6] rounded-xl flex items-center justify-center font-bold text-sm mb-4">
                {step}
              </div>
              <Icon size={24} className="text-[#004ac6] mb-3" />
              <h3 className="font-semibold text-[#191c1d] mb-2">{title}</h3>
              <p className="text-sm text-[#434655] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-[#f3f4f5] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#191c1d] mb-3">Pourquoi choisir GETRAD</h2>
            <p className="text-[#434655]">La plateforme de référence pour les professionnels de la traduction en France</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Profils vérifiés',
                desc: 'Chaque interprète est soumis à une vérification d\'identité et de documents officiels (KBIS, carte d\'identité). Vous traitez uniquement avec des professionnels.',
                color: 'bg-green-100 text-green-700',
              },
              {
                icon: Globe,
                title: '50+ langues disponibles',
                desc: 'Français, anglais, arabe, chinois, espagnol et bien d\'autres. Toutes les spécialités : juridique, médical, commercial, conférence...',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                icon: Star,
                title: 'Système d\'avis',
                desc: 'Lisez les avis laissés par d\'autres clients pour choisir le meilleur interprète pour votre mission. Transparence totale.',
                color: 'bg-yellow-100 text-yellow-700',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-card">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-[#191c1d] text-lg mb-2">{title}</h3>
                <p className="text-sm text-[#434655] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-r from-[#004ac6] to-[#2563eb] rounded-3xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à trouver votre interprète ?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Rejoignez des centaines de clients et d&apos;interprètes qui utilisent GETRAD chaque jour.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#004ac6] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Créer un compte gratuit
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#191c1d] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#004ac6] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <span className="font-bold text-lg">GETRAD</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} GETRAD. Tous droits réservés.
            </p>
            <div className="flex gap-4 text-sm text-gray-400 flex-wrap justify-center">
              <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-white transition-colors">Inscription</Link>
              <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
              <Link href="/politique-de-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
