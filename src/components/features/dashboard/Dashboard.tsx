import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import QuoteDetailsModal from './QuoteDetailsModal';

interface Quote {
  id: string;
  created_at: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  apartment_type: string;
  unit_number: string | null;
  monthly_rent: number;
  move_in_date: string;
  lease_term_months: number;
  number_of_persons: number;
  number_of_pets: number;
  needs_extra_parking: boolean;
  needs_animal_cleanup: boolean;
  prorated_rent: number;
  monthly_total: number;
  move_in_total: number;
  grand_total: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true; // Flag para evitar race conditions

    const fetchQuotes = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false });

        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          if (fetchError) throw fetchError;
          setQuotes(data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching quotes:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchQuotes();
    } else {
      if (isMounted) {
        setLoading(false);
      }
    }

    // Cleanup: marcar como desmontado
    return () => {
      isMounted = false;
    };
  }, [user]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Función de búsqueda y filtros combinados
  const filteredQuotes = quotes.filter((quote) => {
    // Búsqueda (case insensitive)
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      quote.tenant_name?.toLowerCase().includes(searchLower) ||
      quote.tenant_email?.toLowerCase().includes(searchLower) ||
      quote.tenant_phone?.includes(searchLower) ||
      quote.apartment_type?.toLowerCase().includes(searchLower);

    // Filtros de fecha
    const quoteDate = new Date(quote.created_at);
    let matchesDate = true;

    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start);
      startDate.setHours(0, 0, 0, 0);
      if (quoteDate < startDate) {
        matchesDate = false;
      }
    }

    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);
      if (quoteDate > endDate) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Estadísticas
  // 1. Total de Quotes (histórico)
  const totalQuotes = quotes.length;

  // 2. Quotes Este Mes
  const thisMonth = quotes.filter((q) => {
    const quoteDate = new Date(q.created_at);
    const now = new Date();
    return (
      quoteDate.getMonth() === now.getMonth() &&
      quoteDate.getFullYear() === now.getFullYear()
    );
  }).length;

  // 3. Top 3 Apartamentos
  const apartmentCounts = quotes.reduce((acc, quote) => {
    const apt = quote.apartment_type || 'N/A';
    acc[apt] = (acc[apt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const top3Apartments = Object.entries(apartmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count], index) => ({
      rank: index + 1,
      name: name,
      count: count,
    }));

  // 4. Últimos 7 Días
  const last7Days = quotes.filter((q) => {
    const quoteDate = new Date(q.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return quoteDate >= sevenDaysAgo;
  }).length;

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuote(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DAA6C]"></div>
          <p className="mt-4 text-gray-700">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">Gestiona y visualiza todos los quotes generados</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Búsqueda - 60% en desktop */}
            <div className="lg:col-span-7">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('dashboard.search')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] transition-colors"
              />
            </div>

            {/* Filtro fecha Desde - 15% en desktop */}
            <div className="lg:col-span-2">
              <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard.from')}
              </label>
              <input
                id="dateStart"
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] transition-colors"
              />
            </div>

            {/* Filtro fecha Hasta - 15% en desktop */}
            <div className="lg:col-span-2">
              <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard.to')}
              </label>
              <input
                id="dateEnd"
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] transition-colors"
              />
            </div>

            {/* Botón limpiar filtros - 10% en desktop */}
            <div className="lg:col-span-1">
              {(searchTerm || dateFilter.start || dateFilter.end) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter({ start: '', end: '' });
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#1DAA6C] rounded-lg hover:bg-[#1a9559] transition-colors"
                >
                  {t('dashboard.clearFilters')}
                </button>
              )}
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('dashboard.showing')} <span className="font-semibold text-gray-800">{filteredQuotes.length}</span> {t('dashboard.of')}{' '}
              <span className="font-semibold text-gray-800">{quotes.length}</span> {t('dashboard.quotes')}
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* 1. Total de Quotes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('stats.total')}</p>
                <p className="text-3xl font-bold text-gray-800">{totalQuotes}</p>
              </div>
              <div className="bg-[#1DAA6C]/10 rounded-full p-3">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </div>

          {/* 2. Quotes Este Mes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('stats.thisMonth')}</p>
                <p className="text-3xl font-bold text-gray-800">{thisMonth}</p>
              </div>
              <div className="bg-[#1DAA6C]/10 rounded-full p-3">
                <span className="text-3xl">📅</span>
              </div>
            </div>
          </div>

          {/* 3. Top 3 Apartamentos - Card más alto */}
          <div className="bg-white rounded-lg shadow-md p-6 min-h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">{t('stats.top3')}</p>
              <div className="bg-[#1DAA6C]/10 rounded-full p-2">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {top3Apartments.length > 0 ? (
                top3Apartments.map((apt) => (
                  <div key={apt.name} className="text-sm">
                    <span className="font-semibold text-gray-800">{apt.rank}.</span>{' '}
                    <span className="text-gray-700 capitalize">{apt.name}</span>{' '}
                    <span className="text-[#1DAA6C] font-medium">({apt.count})</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay datos</p>
              )}
            </div>
          </div>

          {/* 4. Últimos 7 Días */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('stats.last7Days')}</p>
                <p className="text-3xl font-bold text-gray-800">{last7Days}</p>
              </div>
              <div className="bg-[#1DAA6C]/10 rounded-full p-3">
                <span className="text-3xl">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de quotes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('dashboard.noQuotes')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {quotes.length === 0
                  ? 'No se han generado quotes aún.'
                  : 'No se encontraron quotes con los filtros aplicados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.client')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.phone')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.apartment')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.tenant_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quote.tenant_email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quote.tenant_phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {quote.apartment_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            quote.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : quote.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {quote.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(quote);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-[#1DAA6C] rounded-lg hover:bg-[#1a9559] transition-colors"
                        >
                          {t('dashboard.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <QuoteDetailsModal
        quote={selectedQuote}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Dashboard;

