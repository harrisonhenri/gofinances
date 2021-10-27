import React, {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
} from 'react'

import AsyncStorage from '@react-native-community/async-storage'

import { api } from '../services/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User
}

interface SignInCredentials {
  email: string
}

interface AuthContextData {
  user: User
  loading: boolean
  signIn(credentials: SignInCredentials): Promise<void>
  signOut(): void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>({} as AuthState)
  const [loading, setLoading] = useState(true)

  const signIn = useCallback(async ({ email }: SignInCredentials) => {
    const response = await api.post<User>('/sessions', {
      email,
    })

    await AsyncStorage.setItem(
      '@gofinances:user',
      JSON.stringify(response.data),
    )

    setData(old => ({ ...old, user: response.data }))
  }, [])

  useEffect(() => {
    async function loadStorageData(): Promise<void> {
      const user = await AsyncStorage.getItem('@gofinances:user')

      if (user) {
        setData({ user: JSON.parse(user) })
      }

      setLoading(false)
    }

    loadStorageData()
  }, [])

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem('@gofinances:user')

    setData({} as AuthState)
  }, [])

  return (
    <AuthContext.Provider value={{ user: data.user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth(): AuthContextData {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthProvider, useAuth }