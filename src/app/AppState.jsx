/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fakeApi } from '../fakeApi'

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [state, setState] = useState(() => fakeApi.init())
  const [currentUser, setCurrentUser] = useState(null)

  const reload = () => setState(fakeApi.init())

  const login = async (email, password) => {
    const result = await fakeApi.auth.login(email, password)
    if (result.ok) setCurrentUser(result.user)
    return result
  }

  const logout = () => setCurrentUser(null)

  const resetDemoData = () => {
    setState(fakeApi.reset())
    setCurrentUser(null)
  }

  const refresh = () => setState(fakeApi.init())

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo(
    () => ({
      state,
      currentUser,
      login,
      logout,
      resetDemoData,
      reload,
    }),
    [state, currentUser],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
