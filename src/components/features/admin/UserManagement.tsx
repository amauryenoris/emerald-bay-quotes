import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

const UserManagement: React.FC = () => {
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      
      let query = supabase
        .from('user_profiles')
        .select('*')
        .is('deleted_at', null) // Excluir usuarios eliminados (soft delete)
        .order('created_at', { ascending: false })
      
      // Filtrar según selección
      if (filter === 'pending') {
        query = query.eq('is_active', false)
      } else if (filter === 'active') {
        query = query.eq('is_active', true)
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false)
      }
      
      const { data, error } = await query
      
      if (!error && data) {
        setUsers(data)
      }
      
      setLoading(false)
    }
    
    fetchUsers()
  }, [filter])

  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: true })
      .eq('id', userId)
    
    if (!error) {
      // Actualizar estado local
      setUsers(users.map(u => u.id === userId ? {...u, is_active: true} : u))
    } else {
      console.error('Error approving user:', error)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', userId)
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? {...u, is_active: false} : u))
    } else {
      console.error('Error deactivating user:', error)
    }
  }

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to DELETE ${userEmail}? This cannot be undone.`)) {
      return
    }
    
    try {
      // Soft delete: marcar como eliminado
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', userId)
      
      if (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user')
        return
      }
      
      // Actualizar UI
      setUsers(users.filter(u => u.id !== userId))
      alert('User deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete user')
    }
  }

  // Calcular estadísticas
  const totalUsers = users.length
  const pendingCount = users.filter(u => !u.is_active).length
  const activeCount = users.filter(u => u.is_active).length

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">User Management</h1>
        
        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#1DAA6C] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('users.all')}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('admin.pending')}
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('admin.active')}
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('admin.inactive')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('users.totalUsers')}</h3>
          <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('users.pendingApproval')}</h3>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('users.activeUsers')}</h3>
          <p className="text-3xl font-bold text-green-600">{activeCount}</p>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.createdAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = currentUser?.id === user.id
                    const isAdmin = user.role === 'admin'
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isAdmin
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.role === 'admin' ? t('users.admin') : t('users.agent')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {user.is_active ? t('admin.active') : t('admin.pending')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {!user.is_active ? (
                              // Pending: Approve y Delete (pero no si es admin y es el usuario actual)
                              <>
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  className="px-3 py-1 bg-[#1DAA6C] text-white rounded hover:bg-emerald-600 transition-colors text-xs"
                                >
                                  {t('admin.approve')}
                                </button>
                                {!(isAdmin && isCurrentUser) && (
                                  <button
                                    onClick={() => handleDelete(user.id, user.email)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                                  >
                                    {t('admin.delete')}
                                  </button>
                                )}
                              </>
                            ) : (
                              // Active: Deactivate y Delete
                              <>
                                {!isCurrentUser && (
                                  <button
                                    onClick={() => handleReject(user.id)}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-xs"
                                  >
                                    {t('admin.deactivate')}
                                  </button>
                                )}
                                {!isAdmin && !isCurrentUser && (
                                  <button
                                    onClick={() => handleDelete(user.id, user.email)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                                  >
                                    {t('admin.delete')}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

