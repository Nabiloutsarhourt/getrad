'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Star, MapPin } from 'lucide-react';
import { getAllInterpreters } from '../../../services/searchService';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import Button from '../../../components/ui/Button';
import { LANGUAGES, SPECIALTIES, FRENCH_CITIES } from '../../../lib/constants';

export default function InterpretersPage() {
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    languageFrom: '',
    languageTo: '',
    specialty: '',
    city: '',
    minRating: '',
    maxHourlyRate: '',
    assermente: false,
  });

  const loadInterpreters = useCallback(async () => {
    setLoading(true);
    const result = await getAllInterpreters(filters);
    if (result.success) setInterpreters(result.interpreters);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadInterpreters();
  }, [loadInterpreters]);

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilters = () => setFilters({
    search: '', languageFrom: '', languageTo: '', specialty: '',
    city: '', minRating: '', maxHourlyRate: '', assermente: false,
  });

  const hasActiveFilters = filters.languageFrom || filters.languageTo || filters.specialty ||
    filters.city || filters.minRating || filters.maxHourlyRate || filters.assermente;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1d]">Trouver un interprète</h1>
        <p className="text-[#434655] mt-1">Parcourez notre annuaire de professionnels vérifiés</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" />
          <input
            type="text"
            placeholder="Rechercher un interprète..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6]"
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'surface'}
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal size={16} />
          Filtres
          {hasActiveFilters && <span className="w-2 h-2 bg-[#ba1a1a] rounded-full" />}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-[#e7e8e9]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#191c1d]">Filtres</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-[#ba1a1a] hover:underline flex items-center gap-1">
                <X size={14} /> Effacer
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[#434655] block mb-1">Langue source</label>
              <select
                value={filters.languageFrom}
                onChange={(e) => updateFilter('languageFrom', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              >
                <option value="">Toutes</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#434655] block mb-1">Langue cible</label>
              <select
                value={filters.languageTo}
                onChange={(e) => updateFilter('languageTo', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              >
                <option value="">Toutes</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#434655] block mb-1">Spécialité</label>
              <select
                value={filters.specialty}
                onChange={(e) => updateFilter('specialty', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              >
                <option value="">Toutes</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#434655] block mb-1">Ville</label>
              <select
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              >
                <option value="">Toutes</option>
                {FRENCH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#434655] block mb-1">Note minimum</label>
              <select
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              >
                <option value="">Toutes</option>
                <option value="3">3+ étoiles</option>
                <option value="4">4+ étoiles</option>
                <option value="4.5">4.5+ étoiles</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#434655] block mb-1">Tarif max (€/h)</label>
              <input
                type="number"
                placeholder="Ex: 100"
                value={filters.maxHourlyRate}
                onChange={(e) => updateFilter('maxHourlyRate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c3c6d7] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="assermente"
              checked={filters.assermente}
              onChange={(e) => updateFilter('assermente', e.target.checked)}
              className="w-4 h-4 rounded text-[#004ac6]"
            />
            <label htmlFor="assermente" className="text-sm text-[#434655]">Interprètes assermentés uniquement</label>
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-[#737686]">
          {interpreters.length} interprète{interpreters.length !== 1 ? 's' : ''} trouvé{interpreters.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Interpreter grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : interpreters.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-card">
          <p className="text-[#737686] mb-2">Aucun interprète trouvé avec ces critères</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-[#004ac6] hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {interpreters.map((interpreter) => (
            <Link
              key={interpreter.id}
              href={`/client/interpreters/${interpreter.id}`}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-deep transition-all hover:-translate-y-1 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={`${interpreter.firstName} ${interpreter.lastName}`}
                  photoURL={interpreter.user?.photoURL}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#191c1d] truncate">
                    {interpreter.firstName} {interpreter.lastName}
                    {interpreter.assermente && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">Assermenté</span>
                    )}
                  </h3>
                  {interpreter.city && (
                    <div className="flex items-center gap-1 text-xs text-[#737686] mt-0.5">
                      <MapPin size={11} />
                      {interpreter.city}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium text-[#434655]">
                      {interpreter.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-xs text-[#737686]">({interpreter.reviewCount || 0} avis)</span>
                  </div>
                </div>
              </div>
              {interpreter.bio && (
                <p className="text-xs text-[#434655] line-clamp-2">{interpreter.bio}</p>
              )}
              {interpreter.languages && interpreter.languages.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {interpreter.languages.slice(0, 3).map((lang, i) => (
                    <span key={i} className="text-xs bg-[#f3f4f5] text-[#434655] px-2 py-0.5 rounded-lg">
                      {lang.source} → {lang.target}
                    </span>
                  ))}
                </div>
              )}
              {interpreter.specialties && interpreter.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {interpreter.specialties.slice(0, 2).map((s, i) => (
                    <span key={i} className="text-xs bg-[#c5f8e1] text-[#006c49] px-2 py-0.5 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-[#e7e8e9]">
                <div>
                  {interpreter.hourlyRate > 0 && (
                    <span className="text-sm font-bold text-[#004ac6]">{interpreter.hourlyRate}€/h</span>
                  )}
                </div>
                <span className="text-xs text-[#004ac6] font-medium">Voir le profil →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
