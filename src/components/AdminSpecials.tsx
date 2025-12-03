import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Special {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  start_date: string;
  end_date: string | null;
  rent_discount: number;
  deposit_discount: number;
  move_in_discount: number;
   apply_to_monthly: boolean;
   apply_to_move_in: boolean;
  created_at: string;
}

type SpecialFormData = Omit<Special, 'id' | 'created_at'>;

const EMPTY_FORM: SpecialFormData = {
  name: '',
  description: '',
  active: true,
  start_date: '',
  end_date: '',
  rent_discount: 0,
  deposit_discount: 0,
  move_in_discount: 0,
  apply_to_monthly: true,
  apply_to_move_in: true,
};

const AdminSpecials: React.FC = () => {
  const { user } = useAuth();

  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingSpecial, setEditingSpecial] = useState<Special | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<SpecialFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecials = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('specials')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching specials:', error);
          return;
        }

        setSpecials((data as Special[]) || []);
      } catch (error) {
        console.error('Error fetching specials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecials();
  }, []);

  const reloadSpecials = async () => {
    const { data, error } = await supabase
      .from('specials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setSpecials((data as Special[]) || []);
    } else {
      console.error('Error reloading specials:', error);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Sin fecha fin';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);

  const openCreateForm = () => {
    setEditingSpecial(null);
    setFormData(EMPTY_FORM);
    setErrorMessage(null);
    setShowForm(true);
  };

  const openEditForm = (special: Special) => {
    setEditingSpecial(special);
    setFormData({
      name: special.name || '',
      description: special.description || '',
      active: special.active,
      start_date: special.start_date ? special.start_date.substring(0, 10) : '',
      end_date: special.end_date ? special.end_date.substring(0, 10) : '',
      rent_discount: special.rent_discount ?? 0,
      deposit_discount: special.deposit_discount ?? 0,
      move_in_discount: special.move_in_discount ?? 0,
      apply_to_monthly: special.apply_to_monthly ?? true,
      apply_to_move_in: special.apply_to_move_in ?? true,
    });
    setErrorMessage(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSpecial(null);
    setFormData(EMPTY_FORM);
    setErrorMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrorMessage('El nombre es requerido.');
      return false;
    }

    if (!formData.start_date) {
      setErrorMessage('La fecha de inicio es requerida.');
      return false;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      setErrorMessage('La fecha de fin debe ser mayor o igual a la fecha de inicio.');
      return false;
    }

    if (
      formData.rent_discount < 0 ||
      formData.deposit_discount < 0 ||
      formData.move_in_discount < 0
    ) {
      setErrorMessage('Los descuentos deben ser mayores o iguales a 0.');
      return false;
    }

    if (!formData.apply_to_monthly && !formData.apply_to_move_in) {
      setErrorMessage('Debes seleccionar al menos dónde se aplica el especial.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        end_date: formData.end_date || null,
      };

      const { error } = await supabase.from('specials').insert(payload);

      if (error) {
        console.error('Error creating special:', error);
        setErrorMessage('No se pudo crear el especial.');
        return;
      }

      await reloadSpecials();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSpecial) return;
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        end_date: formData.end_date || null,
      };

      const { error } = await supabase
        .from('specials')
        .update(payload)
        .eq('id', editingSpecial.id);

      if (error) {
        console.error('Error updating special:', error);
        setErrorMessage('No se pudo actualizar el especial.');
        return;
      }

      await reloadSpecials();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (specialId: string) => {
    if (!window.confirm('¿Eliminar este especial?')) return;

    const { error } = await supabase.from('specials').delete().eq('id', specialId);

    if (error) {
      console.error('Error deleting special:', error);
      return;
    }

    await reloadSpecials();
  };

  const handleToggleActive = async (special: Special) => {
    const { id, active } = special;
    const { error } = await supabase
      .from('specials')
      .update({ active: !active })
      .eq('id', id);

    if (error) {
      console.error('Error toggling active status:', error);
      return;
    }

    await reloadSpecials();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
        <p className="text-gray-700">
          Debes iniciar sesión para gestionar los especiales.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DAA6C]"></div>
          <p className="mt-4 text-gray-700">Cargando especiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gestión de Especiales
            </h1>
            <p className="text-gray-600">
              Crea, edita y administra los especiales promocionales de Emerald Bay.
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#1DAA6C] text-white font-semibold shadow-md hover:bg-emerald-dark transition-colors"
          >
            <span className="mr-2 text-lg">+</span>
            Nuevo Especial
          </button>
        </div>

        {/* Tabla de especiales */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {specials.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">
                No hay especiales configurados aún. Crea uno nuevo para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vigencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descuentos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aplica a
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {specials.map((special) => (
                    <tr key={special.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {special.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {special.description
                          ? special.description.length > 80
                            ? `${special.description.slice(0, 77)}...`
                            : special.description
                          : 'Sin descripción'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            special.active
                              ? 'bg-[#1DAA6C]/10 text-[#1DAA6C]'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {special.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span>{formatDate(special.start_date)}</span>
                          <span className="text-xs text-gray-500">
                            {special.end_date ? formatDate(special.end_date) : 'Sin fecha fin'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span>Renta: {formatCurrency(special.rent_discount)}</span>
                          <span>Depósito: {formatCurrency(special.deposit_discount)}</span>
                          <span>Mudanza: {formatCurrency(special.move_in_discount)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {special.apply_to_monthly && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-dark border border-emerald-100">
                              Monthly
                            </span>
                          )}
                          {special.apply_to_move_in && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              Move-in
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditForm(special)}
                          className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(special.id)}
                          className="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => handleToggleActive(special)}
                          className={`px-2 py-1 rounded text-xs ${
                            special.active
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                              : 'bg-[#1DAA6C] text-white hover:bg-emerald-dark'
                          }`}
                        >
                          {special.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulario (modal sencilla tipo overlay) */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingSpecial ? 'Editar Especial' : 'Nuevo Especial'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Define los detalles del especial y sus descuentos.
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                    placeholder="Ej. Move-in Special de Primavera"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                    placeholder="Describe los detalles del especial..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="active"
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#1DAA6C] border-gray-300 rounded focus:ring-[#1DAA6C]"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    Especial activo
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de fin
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Deja en blanco si el especial no tiene fecha de término.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento en renta
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        name="rent_discount"
                        min={0}
                        value={formData.rent_discount}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento en depósito
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        name="deposit_discount"
                        min={0}
                        value={formData.deposit_discount}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento en mudanza
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        name="move_in_discount"
                        min={0}
                        value={formData.move_in_discount}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DAA6C] focus:border-[#1DAA6C] text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Dónde se aplica este especial?
                    </label>
                    <div className="space-y-2 text-sm text-gray-700">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.apply_to_monthly || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              apply_to_monthly: e.target.checked,
                            })
                          }
                          className="mr-2 h-4 w-4 text-[#1DAA6C] border-gray-300 rounded focus:ring-[#1DAA6C]"
                        />
                        <span>Monthly Costs (renta mensual)</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.apply_to_move_in || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              apply_to_move_in: e.target.checked,
                            })
                          }
                          className="mr-2 h-4 w-4 text-[#1DAA6C] border-gray-300 rounded focus:ring-[#1DAA6C]"
                        />
                        <span>Move-in Charges (depósito, costos de mudanza)</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona al menos una opción.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-100"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={editingSpecial ? handleUpdate : handleCreate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#1DAA6C] text-white text-sm font-semibold shadow hover:bg-emerald-dark disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSpecials;


