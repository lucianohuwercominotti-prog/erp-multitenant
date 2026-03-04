import React, { useState, useContext } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { loginCliente } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = ({ loja }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const corPrimaria = loja?.cor_primaria || '#3B82F6';
  const corSecundaria = loja?.cor_secundaria || '#1E40AF';

  // Verificar se veio de uma página que requer login
  const from = location.state?.from || `/loja/${slug}`;
  const mensagemRedirect = location.state?.mensagem;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (!formData.email.trim()) {
      setErro('Informe seu e-mail');
      return;
    }

    if (!formData.senha) {
      setErro('Informe sua senha');
      return;
    }

    try {
      setLoading(true);
      const response = await loginCliente(slug, formData);
      
      // Salvar token e dados do usuário
      login(response.token, response.usuario);
      
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Erro no login:', error);
      const mensagem = error.response?.data?.erro || 'E-mail ou senha incorretos';
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header simplificado */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link 
            to={`/loja/${slug}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para a loja
          </Link>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Logo/Nome da Loja */}
            <div className="text-center mb-8">
              {loja?.logo ? (
                <img 
                  src={loja.logo} 
                  alt={loja.nome_exibicao} 
                  className="h-16 mx-auto mb-4"
                />
              ) : (
                <div 
                  className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {loja?.nome_exibicao?.charAt(0) || 'L'}
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-800">
                Entrar na sua conta
              </h1>
              <p className="text-gray-500 mt-1">
                Acesse {loja?.nome_exibicao || 'a loja'}
              </p>
            </div>

            {/* Mensagem de Redirect */}
            {mensagemRedirect && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">{mensagemRedirect}</p>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{erro}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': corPrimaria }}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': corPrimaria }}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: corPrimaria }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Link para Cadastro */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  to={`/loja/${slug}/cadastro`}
                  className="font-medium hover:underline"
                  style={{ color: corPrimaria }}
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;