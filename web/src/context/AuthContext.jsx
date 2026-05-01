import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const seedUsers = {
  teacher: { name: 'Teacher A', role: 'teacher' },
  student: { name: 'Student A', role: 'student' },
  admin: { name: 'Admin A', role: 'admin' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = (role) => setUser(seedUsers[role] || null);
  const logout = () => setUser(null);
  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
