import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem('sg_user')
        if (stored) {
            try { setUser(JSON.parse(stored)) } catch { localStorage.clear() }
        }
        setLoading(false)
    }, [])

    const login = (userData, token) => {
        localStorage.setItem('sg_access_token', token)
        localStorage.setItem('sg_user', JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('sg_access_token')
        localStorage.removeItem('sg_user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
