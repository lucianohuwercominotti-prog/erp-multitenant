import React, { createContext, useState, useEffect, useContext } from 'react';

// Criar o contexto
export const AuthContext = createContext();

// Hook customizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider do contexto
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const tokenSalvo = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');

    if (tokenSalvo && usuarioSalvo) {
      try {
        setToken(tokenSalvo);
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
    setLoading(false);
  }, []);

  // Função de login
  const login = (novoToken, novoUsuario) => {
    setToken(novoToken);
    setUsuario(novoUsuario);
    localStorage.setItem('token', novoToken);
    localStorage.setItem('usuario', JSON.stringify(novoUsuario));
  };

  // Função de logout
  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  // Verificar se está autenticado
  const isAuthenticated = () => {
    return !!token && !!usuario;
  };

  // Verificar se é admin
  const isAdmin = () => {
    return !!usuario && usuario.tipo === 'admin';
  };

  // Verificar se é cliente
  const isCliente = () => {
    return !!usuario && usuario.tipo === 'cliente';
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isCliente
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;