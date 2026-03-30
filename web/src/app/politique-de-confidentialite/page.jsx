import Link from 'next/link';

export const metadata = {
  title: 'Politique de Confidentialité — GETRAD',
  description: 'Politique de confidentialité et traitement des données personnelles de GETRAD, conformément au RGPD.',
};

const SECTIONS = [
  {
    title: '1. Responsable du traitement',
    text: 'GETRAD est responsable du traitement de vos données personnelles. Pour toute question relative à vos données, vous pouvez nous contacter à l\'adresse : privacy@getrad.app',
  },
  {
    title: '2. Données collectées',
    text: 'Nous collectons les données que vous nous fournissez lors de votre inscription et de l\'utilisation de nos services : adresse e-mail, numéro de téléphone, nom et prénom, photo de profil, adresse postale (interprètes uniquement), numéro SIRET (interprètes uniquement), documents d\'identité (interprètes uniquement dans le cadre de la vérification). Nous collectons également des données de connexion et d\'utilisation générées automatiquement lors de votre utilisation de la plateforme.',
  },
  {
    title: '3. Finalités du traitement',
    text: 'Vos données sont utilisées pour : créer et gérer votre compte, mettre en relation clients et interprètes, traiter les paiements d\'abonnement via notre prestataire Stripe, vérifier l\'identité des interprètes professionnels, envoyer des notifications relatives à vos missions et réservations, améliorer nos services et détecter les fraudes.',
  },
  {
    title: '4. Base légale',
    text: 'Le traitement de vos données repose sur : l\'exécution du contrat (gestion de votre compte et fourniture du service), votre consentement (communications marketing, si applicable), notre intérêt légitime (sécurité, prévention de la fraude, amélioration du service), le respect d\'une obligation légale (conservation des données de facturation).',
  },
  {
    title: '5. Destinataires des données',
    text: 'Vos données peuvent être partagées avec : les autres utilisateurs de la plateforme dans la limite strictement nécessaire à la mise en relation (coordonnées complètes uniquement après acceptation mutuelle), nos prestataires techniques (Firebase/Google pour l\'hébergement, Stripe pour les paiements, Expo pour les notifications push). Ces prestataires agissent en qualité de sous-traitants et sont liés par des obligations de confidentialité.',
  },
  {
    title: '6. Transferts hors UE',
    text: 'Certains de nos prestataires (Google, Stripe) peuvent transférer vos données hors de l\'Union Européenne. Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types approuvées par la Commission Européenne, certification Privacy Shield ou mécanismes équivalents).',
  },
  {
    title: '7. Durée de conservation',
    text: 'Vos données sont conservées pendant toute la durée de votre compte actif. En cas de suppression de compte, vos données personnelles sont supprimées dans un délai de 30 jours, à l\'exception des données de facturation conservées 10 ans conformément aux obligations légales françaises.',
  },
  {
    title: '8. Vos droits',
    text: 'Conformément au RGPD, vous disposez des droits suivants : droit d\'accès à vos données, droit de rectification, droit à l\'effacement (« droit à l\'oubli »), droit à la portabilité, droit d\'opposition et droit à la limitation du traitement. Pour exercer ces droits, contactez : privacy@getrad.app. Vous disposez également du droit d\'introduire une réclamation auprès de la CNIL (www.cnil.fr).',
  },
  {
    title: '9. Sécurité',
    text: 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Les données sensibles (documents d\'identité, coordonnées complètes) sont stockées dans des espaces sécurisés accessibles uniquement via notre API avec authentification.',
  },
  {
    title: '10. Cookies',
    text: 'Notre application web utilise des cookies techniques strictement nécessaires au fonctionnement du service (authentification, préférences de session). Ces cookies ne nécessitent pas votre consentement préalable. Nous n\'utilisons pas de cookies à des fins publicitaires ou de tracking tiers.',
  },
  {
    title: '11. Modifications',
    text: 'Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification substantielle vous sera notifiée par e-mail avec un préavis de 30 jours.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <nav className="bg-white border-b border-[#e7e8e9] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-xl text-[#191c1d]">GETRAD</span>
          </Link>
          <Link href="/" className="text-sm text-[#004ac6] hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="bg-[#004ac6] rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-8 w-28 h-28 bg-white/5 rounded-full" />
          <p className="text-sm text-blue-200 mb-2">Dernière mise à jour : janvier 2025</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-blue-100 text-sm">
            Traitement de vos données personnelles — conformément au RGPD (Règlement UE 2016/679)
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-bold text-[#191c1d] mb-3">{section.title}</h2>
              <p className="text-sm text-[#434655] leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-6 bg-[#dbe1ff] rounded-2xl p-6">
          <p className="text-sm font-semibold text-[#191c1d] mb-1">Contact Délégué à la Protection des Données</p>
          <p className="text-sm text-[#434655]">
            Pour toute question ou demande relative à vos données personnelles :{' '}
            <a href="mailto:privacy@getrad.app" className="text-[#004ac6] font-medium hover:underline">
              privacy@getrad.app
            </a>
          </p>
          <p className="text-xs text-[#737686] mt-2">
            Commission Nationale de l&apos;Informatique et des Libertés (CNIL) :{' '}
            <span className="font-medium">www.cnil.fr</span>
          </p>
        </div>

        {/* Footer nav */}
        <div className="mt-6 flex gap-4 text-sm text-[#737686]">
          <Link href="/" className="hover:text-[#004ac6] transition-colors">Accueil</Link>
          <Link href="/cgu" className="hover:text-[#004ac6] transition-colors">CGU</Link>
          <Link href="/login" className="hover:text-[#004ac6] transition-colors">Connexion</Link>
        </div>
      </main>
    </div>
  );
}
