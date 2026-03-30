import Link from 'next/link';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — GETRAD',
  description: 'Conditions générales d\'utilisation de la plateforme GETRAD pour les interprètes et traducteurs professionnels.',
};

const CGU_SECTIONS = [
  {
    title: '1. Nature du service',
    text: 'GETRAD est une plateforme de mise en relation entre des clients (particuliers, entreprises, administrations) et des interprètes/traducteurs professionnels. GETRAD n\'est pas un employeur et ne prend aucune commission sur les prestations réalisées.',
  },
  {
    title: '2. Abonnement et accès',
    text: 'L\'accès aux missions et à la visibilité sur la plateforme est conditionné à un abonnement mensuel payant selon le plan choisi (Découverte, Professionnel ou Premium). Sans abonnement actif, le profil ne sera pas visible dans les résultats de recherche.',
  },
  {
    title: '3. Paiements',
    text: 'Le paiement des prestations d\'interprétation ou de traduction s\'effectue directement entre le client et l\'interprète, en dehors de l\'application. GETRAD ne gère pas, ne perçoit pas et n\'est pas responsable de ces paiements.',
  },
  {
    title: '4. Confidentialité des coordonnées',
    text: 'Vos coordonnées personnelles (nom complet, email, téléphone, adresse) ne sont partagées avec un client qu\'après acceptation mutuelle d\'une mission ou demande de réservation. Avant acceptation, seul votre prénom et des informations professionnelles sont visibles.',
  },
  {
    title: '5. Délai de réponse',
    text: 'Vous disposez de 2 minutes pour accepter ou refuser chaque offre de mission reçue. Un taux de non-réponse élevé peut entraîner une baisse de votre priorité dans l\'algorithme d\'affectation.',
  },
  {
    title: '6. Qualité et fiabilité',
    text: 'Vous êtes responsable de la qualité de vos prestations et de l\'exactitude des informations fournies sur votre profil (diplômes, certifications, langues maîtrisées). GETRAD se réserve le droit de suspendre tout compte en cas de fausse déclaration ou d\'abus signalé.',
  },
  {
    title: '7. Avis clients',
    text: 'Les avis laissés par les clients après une prestation sont publiés sans modification sur votre profil. Vous ne pouvez pas demander la suppression d\'un avis sauf en cas de contenu illicite.',
  },
  {
    title: '8. Résiliation',
    text: 'Vous pouvez résilier votre abonnement à tout moment depuis votre espace de gestion. La résiliation prend effet à la fin de la période en cours. Aucun remboursement n\'est effectué pour la période entamée.',
  },
  {
    title: '9. Droit de rétractation',
    text: 'Conformément à la loi française, vous disposez d\'un droit de rétractation de 14 jours à compter de la souscription de votre abonnement, sauf si vous avez expressément demandé à bénéficier du service avant l\'expiration de ce délai.',
  },
  {
    title: '10. Données personnelles',
    text: 'Vos données personnelles sont traitées conformément au Règlement Général sur la Protection des Données (RGPD). Vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Pour toute demande, contactez : privacy@getrad.app',
  },
  {
    title: '11. Propriété intellectuelle',
    text: 'L\'ensemble des éléments constituant la plateforme GETRAD (logo, design, textes, fonctionnalités) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.',
  },
  {
    title: '12. Responsabilité',
    text: 'GETRAD agit en qualité d\'intermédiaire technique. Sa responsabilité ne peut être engagée pour les prestations réalisées entre les utilisateurs. GETRAD ne garantit pas la disponibilité continue de la plateforme et se réserve le droit d\'effectuer des maintenances.',
  },
  {
    title: '13. Modification des CGU',
    text: 'GETRAD se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés par e-mail de toute modification substantielle. L\'utilisation continue de la plateforme après notification vaut acceptation des nouvelles CGU.',
  },
  {
    title: '14. Droit applicable',
    text: 'Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents de Paris.',
  },
];

export default function CGUPage() {
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
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-blue-100 text-sm">
            GETRAD — Plateforme de mise en relation entre clients et interprètes professionnels
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {CGU_SECTIONS.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-bold text-[#191c1d] mb-3">{section.title}</h2>
              <p className="text-sm text-[#434655] leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-6 bg-[#dbe1ff] rounded-2xl p-6">
          <p className="text-sm text-[#434655]">
            Pour toute question relative aux présentes CGU ou à la protection de vos données,
            contactez-nous à{' '}
            <a href="mailto:privacy@getrad.app" className="text-[#004ac6] font-medium hover:underline">
              privacy@getrad.app
            </a>
          </p>
        </div>

        {/* Footer nav */}
        <div className="mt-6 flex gap-4 text-sm text-[#737686]">
          <Link href="/" className="hover:text-[#004ac6] transition-colors">Accueil</Link>
          <Link href="/politique-de-confidentialite" className="hover:text-[#004ac6] transition-colors">
            Politique de confidentialité
          </Link>
          <Link href="/login" className="hover:text-[#004ac6] transition-colors">Connexion</Link>
        </div>
      </main>
    </div>
  );
}
