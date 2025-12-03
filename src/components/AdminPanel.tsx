import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import AdminSpecials from './AdminSpecials'
import UserManagement from './UserManagement'

const AdminPanel: React.FC = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'specials' | 'users'>('specials')

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab('specials')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'specials'
                ? 'border-[#1DAA6C] text-[#1DAA6C]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.specials')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-[#1DAA6C] text-[#1DAA6C]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.users')}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'specials' && <AdminSpecials />}
      {activeTab === 'users' && <UserManagement />}
    </div>
  )
}

export default AdminPanel

