import React, { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface LoginProps {
  onSwitchToRegister?: () => void
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Verificar configuración antes de intentar login
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || supabaseUrl === 'REEMPLAZAR_CON_TU_URL' || !supabaseUrl.startsWith('https://')) {
        setError('Error de configuración: VITE_SUPABASE_URL no está configurada correctamente. Verifica tu archivo .env.local')
        setLoading(false)
        return
      }

      if (!supabaseKey || supabaseKey === 'REEMPLAZAR_CON_TU_KEY' || supabaseKey.length < 20) {
        setError('Error de configuración: VITE_SUPABASE_ANON_KEY no está configurada correctamente. Verifica tu archivo .env.local')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Mensajes de error más específicos
        if (error.message.includes('fetch')) {
          setError('Error de conexión con Supabase. Verifica que la URL sea correcta y que el servidor esté accesible.')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Credenciales inválidas. Verifica tu email y contraseña.')
        } else {
          setError(error.message)
        }
        console.error('Supabase auth error:', error)
        return
      }

      // Verificar si usuario está activo
      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_active')
          .eq('id', data.user.id)
          .single()
        
        if (profileError || !profile) {
          setError('Unable to verify account status')
          await supabase.auth.signOut()
          return
        }
        
        if (!profile.is_active) {
          setError('Your account is pending admin approval. Please contact an administrator.')
          await supabase.auth.signOut()
          return
        }

        // Si llegamos aquí, está todo OK
        // El AuthContext manejará el resto
        console.log('Login exitoso:', data.user.email)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err?.message?.includes('fetch') || err?.name === 'TypeError') {
        setError('Error de conexión: No se pudo conectar con el servidor de autenticación. Verifica tu conexión a internet y la configuración de Supabase.')
      } else {
        setError(`Error inesperado: ${err?.message || 'Error desconocido'}`)
      }
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
          <p className="text-sm text-gray-500 mt-1">Iniciar Sesión</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
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
              Contraseña
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
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-4 text-center border-t pt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Create agent account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login


