import React, { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../../context/LanguageContext'
import { isValidEmail } from '../../../utils/validators'
import { getUserFriendlyError, logError } from '../../../utils/errorHandler'

interface LoginProps {
  onSwitchToRegister?: () => void
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { t } = useLanguage()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validate email format
    if (!isValidEmail(email)) {
      setError('Invalid email format')
      setLoading(false)
      return
    }
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) {
        logError(authError, 'Login - Authentication')
        setError(getUserFriendlyError(authError))
        setLoading(false)
        return
      }
      
      if (!authData.user) {
        const error = new Error('Login failed: No user data returned')
        logError(error, 'Login - No user data')
        setError(getUserFriendlyError(error))
        setLoading(false)
        return
      }
      
      // 2. VERIFICAR si usuario está activo
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_active, deleted_at')
        .eq('id', authData.user.id)
        .single()
      
      if (profileError) {
        logError(profileError, 'Login - Profile verification')
        setError('Unable to verify account status')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }
      
      // 3. Verificar si está eliminado
      if (profile.deleted_at) {
        setError('This account has been deleted. Please contact support.')
        await supabase.auth.signOut()
        return
      }
      
      // 4. Verificar si está activo
      if (!profile.is_active) {
        setError('Your account is pending admin approval. Please contact an administrator.')
        await supabase.auth.signOut()
        return
      }
      
      // 5. Si llegamos aquí, todo está OK
      // El AuthContext detectará el login y actualizará el estado
      
    } catch (err) {
      const error = err as Error
      logError(error, 'Login')
      setError(getUserFriendlyError(error))
    } finally {
      setLoading(false)
    }
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
          <p className="text-sm text-gray-500 mt-1">{t('auth.login')}</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-4 text-center border-t pt-4">
            <p className="text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                {t('auth.registerHere')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

