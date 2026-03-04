import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://erp-backend-qwq3.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

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

export const buscarLojaPorSlug = async (slug) => {
  const response = await api.get(`/lojas/${slug}`);
  return response.data;
};

export const buscarLojasPorNome = async (termo) => {
  const response = await api.get(`/lojas/buscar?nome=${encodeURIComponent(termo)}`);
  return response.data;
};

export const listarProdutosPublicos = async (slug, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/loja/${slug}/produtos?${queryString}`);
  return response.data;
};

export const buscarProdutoPublico = async (slug, produtoId) => {
  const response = await api.get(`/loja/${slug}/produtos/${produtoId}`);
  return response.data;
};

export const listarCategoriasPublicas = async (slug) => {
  const response = await api.get(`/loja/${slug}/categorias`);
  return response.data;
};

export const loginCliente = async (slug, dados) => {
  const response = await api.post('/auth/cliente/login', { ...dados, slug });
  return response.data;
};

export const cadastrarCliente = async (slug, dados) => {
  const response = await api.post('/auth/cliente/register', { ...dados, slug });
  return response.data;
};

export const criarOrcamentoCliente = async (dados) => {
  const response = await api.post('/orcamentos', dados);
  return response.data;
};

export default api;
