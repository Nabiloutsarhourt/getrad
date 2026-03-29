'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, CheckCircle, ArrowLeft, MessageSquare, Calendar,
  Briefcase, Globe, Award, Phone
} from 'lucide-react';
import { getInterpreterById } from '../../../../services/searchService';
import { getOrCreateConversation } from '../../../../services/messageService';
import { getInterpreterReviews } from '../../../../services/reviewService';
import { useAuth } from '../../../../contexts/AuthContext';
import Avatar from '../../../../components/ui/Avatar';
import Badge from '../../../../components/ui/Badge';
import Spinner from '../../../../components/ui/Spinner';
import Button from '../../../../components/ui/Button';

export default function InterpreterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [interpreter, setInterpreter] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [interpResult, reviewsResult] = await Promise.all([
        getInterpreterById(id),
        getInterpreterReviews(id),
      ]);
      if (interpResult.success) setInterpreter(interpResult.interpreter);
      if (reviewsResult.success) setReviews(reviewsResult.reviews);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const handleMessage = async () => {
    if (!user || !userData || !interpreter) return;
    setMessageLoading(true);
    try {
      const otherUser = {
        displayName: `${interpreter.firstName} ${interpreter.lastName}`,
        photoURL: interpreter.user?.photoURL || '',
        role: 'interpreter',
      };
      const result = await getOrCreateConversation(user.uid, id, userData, otherUser);
      if (result.success) {
        router.push(`/client/messages/${result.conversation.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!interpreter) {
    return (
      <div className="text-center py-16">
        <p className="text-[#737686]">Interprète introuvable</p>
        <Link href="/client/interpreters" className="mt-4 inline-block text-sm text-[#004ac6] hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const fullName = `${interpreter.firstName} ${interpreter.lastName}`;
  const stars = interpreter.rating || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/client/interpreters" className="inline-flex items-center gap-1 text-sm text-[#434655] hover:text-[#191c1d]">
        <ArrowLeft size={16} /> Retour à la liste
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-start gap-4">
          <Avatar name={fullName} photoURL={interpreter.user?.photoURL} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#191c1d]">{fullName}</h1>
              {interpreter.verificationStatus === 'accepte' && (
                <CheckCircle size={18} className="text-[#006c49]" />
              )}
              {interpreter.assermente && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-medium">
                  Assermenté(e)
                </span>
              )}
            </div>
            {interpreter.city && (
              <div className="flex items-center gap-1 text-sm text-[#737686] mt-1">
                <MapPin size={14} />
                {interpreter.city}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={16}
                  className={i <= Math.round(stars) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 fill-gray-200'}
                />
              ))}
              <span className="text-sm font-medium text-[#434655] ml-1">
                {stars.toFixed(1)} ({interpreter.reviewCount || 0} avis)
              </span>
            </div>
            {interpreter.hourlyRate > 0 && (
              <p className="text-lg font-bold text-[#004ac6] mt-2">
                {interpreter.hourlyRate}€ / heure
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <Link href={`/client/book/${id}`} className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              <Calendar size={18} />
              Réserver
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={handleMessage}
            loading={messageLoading}
            className="flex-1"
          >
            <MessageSquare size={18} />
            Message
          </Button>
        </div>
      </div>

      {/* Bio */}
      {interpreter.bio && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-[#191c1d] mb-2">À propos</h2>
          <p className="text-sm text-[#434655] leading-relaxed">{interpreter.bio}</p>
        </div>
      )}

      {/* Languages */}
      {interpreter.languages && interpreter.languages.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-[#191c1d] mb-3 flex items-center gap-2">
            <Globe size={16} className="text-[#004ac6]" />
            Langues
          </h2>
          <div className="space-y-2">
            {interpreter.languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#f3f4f5] last:border-0">
                <span className="text-sm font-medium text-[#191c1d] flex-1">{lang.source}</span>
                <span className="text-[#737686] text-xs">→</span>
                <span className="text-sm font-medium text-[#191c1d] flex-1">{lang.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specialties */}
      {interpreter.specialties && interpreter.specialties.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-[#191c1d] mb-3 flex items-center gap-2">
            <Award size={16} className="text-[#004ac6]" />
            Spécialités
          </h2>
          <div className="flex flex-wrap gap-2">
            {interpreter.specialties.map((s, i) => (
              <span key={i} className="bg-[#dbe1ff] text-[#004ac6] text-xs font-medium px-3 py-1 rounded-xl">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {interpreter.services && interpreter.services.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-[#191c1d] mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-[#004ac6]" />
            Services proposés
          </h2>
          <ul className="space-y-1">
            {interpreter.services.map((service, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#434655]">
                <CheckCircle size={14} className="text-[#006c49] shrink-0" />
                {typeof service === 'object' ? service.label : service}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Regions */}
      {interpreter.regions && interpreter.regions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-[#191c1d] mb-3">Zones d&apos;intervention</h2>
          <div className="flex flex-wrap gap-2">
            {interpreter.regions.map((r, i) => (
              <span key={i} className="bg-[#c5f8e1] text-[#006c49] text-xs font-medium px-3 py-1 rounded-xl">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold text-[#191c1d] mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            Avis ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b border-[#f3f4f5] pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        size={12}
                        className={i <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 fill-gray-200'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#737686]">
                    {review.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || ''}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-[#434655]">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
