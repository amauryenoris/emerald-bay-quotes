import React, { useEffect } from 'react';

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

interface QuoteDetailsModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({ quote, isOpen, onClose }) => {
  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Formatear fecha con hora
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  // Formatear fecha sin hora
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Si no está abierto, no renderizar
  if (!isOpen) {
    return null;
  }

  // Si no hay quote, mostrar mensaje
  if (!quote) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <p className="text-gray-600">No hay información disponible</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-[#1DAA6C] text-white rounded-lg hover:bg-[#1a9559] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Detalles del Quote</h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatDateTime(quote.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                quote.status === 'sent'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {quote.status || 'pending'}
            </span>
            {/* Botón X para cerrar */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#1DAA6C] transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Cerrar modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {/* Información del Cliente */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1DAA6C] mb-4">
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre Completo
                </label>
                <p className="text-gray-900">{quote.tenant_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{quote.tenant_email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Teléfono
                </label>
                <p className="text-gray-900">{quote.tenant_phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Número de Personas
                </label>
                <p className="text-gray-900">{quote.number_of_persons || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Número de Mascotas
                </label>
                <p className="text-gray-900">{quote.number_of_pets || 0}</p>
              </div>
            </div>
          </div>

          {/* Detalles del Apartamento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1DAA6C] mb-4">
              Detalles del Apartamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tipo de Apartamento
                </label>
                <p className="text-gray-900 capitalize">
                  {quote.apartment_type || 'N/A'}
                </p>
              </div>
              {quote.unit_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Unidad
                  </label>
                  <p className="text-gray-900">{quote.unit_number}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Fecha de Mudanza
                </label>
                <p className="text-gray-900">
                  {formatDate(quote.move_in_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Término del Contrato
                </label>
                <p className="text-gray-900">
                  {quote.lease_term_months || 0} meses
                </p>
              </div>
            </div>
          </div>

          {/* Costos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1DAA6C] mb-4">Costos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <label className="text-sm font-medium text-gray-600">
                  Total mensual:
                </label>
                <p className="text-gray-900 font-medium">
                  {formatCurrency(quote.monthly_total)}
                </p>
              </div>
              <div className="flex justify-between items-center py-2">
                <label className="text-sm font-medium text-gray-600">
                  Total de mudanza:
                </label>
                <p className="text-gray-900 font-medium">
                  {formatCurrency(quote.move_in_total)}
                </p>
              </div>
            </div>
          </div>

          {/* Servicios Adicionales */}
          <div>
            <h3 className="text-lg font-semibold text-[#1DAA6C] mb-4">
              Servicios Adicionales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Parking Extra
                </label>
                <p className="text-gray-900">
                  {quote.needs_extra_parking ? 'Sí' : 'No'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Animal Cleanup
                </label>
                <p className="text-gray-900">
                  {quote.needs_animal_cleanup ? 'Sí' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botón cerrar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1DAA6C] text-white rounded-lg hover:bg-[#1a9559] transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailsModal;

