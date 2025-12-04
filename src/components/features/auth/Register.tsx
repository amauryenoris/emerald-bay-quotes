import React, { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../../context/LanguageContext'
import { isValidEmail } from '../../../utils/validators'
import { sanitizeText } from '../../../utils/sanitize'
import { getUserFriendlyError, logError } from '../../../utils/errorHandler'

interface RegisterProps {
  onSwitchToLogin: () => void
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { t } = useLanguage()
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email format
    if (!isValidEmail(email)) {
      setError('Invalid email format')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })
      
      if (authError) throw authError
      
      // Crear perfil con role 'agent'
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: email, // Email already validated
            full_name: sanitizeText(fullName),
            role: 'agent',
            is_active: false
          })
        
        if (profileError) throw profileError
        
        setSuccess(true)
      }
    } catch (err: any) {
      logError(err, 'Register')
      setError(getUserFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/Emerald_Bay_Logo_for_Documents.png"
              alt="Emerald Bay Logo"
              className="h-16 mb-4"
            />
            <h1 className="text-2xl font-semibold text-gray-800 text-center">
              Emerald Bay Quote System
            </h1>
          </div>
          
          <div className="text-center">
            <div className="text-green-600 text-xl mb-4">✓ {t('auth.accountCreated')}</div>
            <p className="text-gray-600 mb-4">
              {t('auth.accountPending')}
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full inline-flex justify-center items-center rounded-lg bg-[#1DAA6C] px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-600 transition-colors"
            >
              {t('auth.goToLogin')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/Emerald_Bay_Logo_for_Documents.png"
            alt="Emerald Bay Logo"
            className="h-16 mb-4"
          />
          <h1 className="text-2xl font-semibold text-gray-800 text-center">
            Emerald Bay Quote System
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('auth.createAccount')}</p>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('auth.fullName')}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('auth.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-lg bg-[#1DAA6C] px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#1DAA6C] font-medium hover:text-emerald-600 hover:underline"
          >
            {t('auth.loginHere')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register

