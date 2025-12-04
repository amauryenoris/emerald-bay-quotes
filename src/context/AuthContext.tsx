import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logError } from '../utils/errorHandler'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  deleted_at: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        logError(error, 'AuthContext - loadUserProfile')
        setUserProfile(null)
        setUserRole(null)
        return
      }
      
      // Verificar si está activo y no eliminado
      if (!data.is_active || data.deleted_at) {
        logError(
          new Error('User is inactive or deleted'),
          'AuthContext - loadUserProfile - User inactive'
        )
        await supabase.auth.signOut()
        setUserProfile(null)
        setUserRole(null)
        return
      }
      
      // Si está activo, cargar normalmente
      setUserProfile(data)
      setUserRole(data.role)
    } catch (err) {
      logError(err, 'AuthContext - loadUserProfile - Exception')
    }
  }

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
        setLoading(false)

        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return
          if (session?.user) {
            setUser(session.user)
            await loadUserProfile(session.user.id)
          } else {
            setUser(null)
            setUserProfile(null)
            setUserRole(null)
          }
          setLoading(false)
        })

        subscription = authSubscription
      } catch (error) {
        logError(error, 'AuthContext - initAuth')
        if (!isMounted) return
        setLoading(false)
      }
    }

    initAuth()

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Verificación continua de is_active cada 5 minutos
  useEffect(() => {
    if (!user) return

    // Verificar is_active cada 5 minutos
    const interval = setInterval(async () => {
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_active, deleted_at')
          .eq('id', user.id)
          .single()

        if (error) {
          logError(error, 'AuthContext - Continuous is_active check')
          return
        }

        // Si el usuario está desactivado o eliminado, cerrar sesión
        if (profile && (!profile.is_active || profile.deleted_at)) {
          logError(
            new Error('User deactivated or deleted during session'),
            'AuthContext - User status changed'
          )
          await supabase.auth.signOut()
          setUserProfile(null)
          setUserRole(null)
        }
      } catch (err) {
        logError(err, 'AuthContext - Continuous is_active check - Exception')
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [user])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUserProfile(null)
      setUserRole(null)
    } catch (error) {
      logError(error, 'AuthContext - signOut')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


