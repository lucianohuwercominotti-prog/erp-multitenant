import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);
// ============================================
// ADICIONE ESTAS FUNÇÕES NO FINAL DO ARQUIVO
// (antes do export default api)
// ============================================

// ============ ROTAS PÚBLICAS DA LOJA ============

// Buscar loja por slug (público)
export const buscarLojaPorSlug = async (slug) => {
  const response = await api.get(`/lojas/${slug}`);
  return response.data;
};

// Buscar lojas por nome (público - landing page)
export const buscarLojasPorNome = async (termo) => {
  const response = await api.get(`/lojas/buscar?nome=${encodeURIComponent(termo)}`);
  return response.data;
};

// Listar produtos públicos da loja
export const listarProdutosPublicos = async (slug, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/loja/${slug}/produtos?${queryString}`);
  return response.data;
};

// Buscar produto público por ID
export const buscarProdutoPublico = async (slug, produtoId) => {
  const response = await api.get(`/loja/${slug}/produtos/${produtoId}`);
  return response.data;
};

// Listar categorias públicas da loja
export const listarCategoriasPublicas = async (slug) => {
  const response = await api.get(`/loja/${slug}/categorias`);
  return response.data;
};

// ============ AUTENTICAÇÃO CLIENTE ============

// Login de cliente
export const loginCliente = async (slug, dados) => {
  const response = await api.post('/auth/cliente/login', { ...dados, slug });
  return response.data;
};

// Cadastro de cliente
export const cadastrarCliente = async (slug, dados) => {
  const response = await api.post('/auth/cliente/register', { ...dados, slug });
  return response.data;
};

// ============ ORÇAMENTOS (CLIENTE) ============

// Criar orçamento (cliente logado)
export const criarOrcamentoCliente = async (dados) => {
  const response = await api.post('/orcamentos', dados);
  return response.data;
};
export default api;