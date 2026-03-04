import React, { useState, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  PhoneIcon,
  IdentificationIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { cadastrarCliente } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Cadastro = ({ loja }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf_cnpj: '',
    telefone: '',
    tipo_documento: 'cpf'
  });
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState({});

  const corPrimaria = loja?.cor_primaria || '#3B82F6';

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    // Formatar CPF
    if (name === 'cpf_cnpj' && formData.tipo_documento === 'cpf') {
      valorFormatado = value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    }

    // Formatar CNPJ
    if (name === 'cpf_cnpj' && formData.tipo_documento === 'cnpj') {
      valorFormatado = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }

    // Formatar telefone
    if (name === 'telefone') {
      valorFormatado = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }

    setFormData(prev => ({ ...prev, [name]: valorFormatado }));
    setErros(prev => ({ ...prev, [name]: '' }));
  };

  const handleTipoDocumento = (tipo) => {
    setFormData(prev => ({ ...prev, tipo_documento: tipo, cpf_cnpj: '' }));
  };

  const validar = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      novosErros.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      novosErros.email = 'E-mail inválido';
    }

    if (!formData.senha) {
      novosErros.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      novosErros.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      novosErros.confirmarSenha = 'As senhas não conferem';
    }

    const docLimpo = formData.cpf_cnpj.replace(/\D/g, '');
    if (!docLimpo) {
      novosErros.cpf_cnpj = 'CPF/CNPJ é obrigatório';
    } else if (formData.tipo_documento === 'cpf' && docLimpo.length !== 11) {
      novosErros.cpf_cnpj = 'CPF deve ter 11 dígitos';
    } else if (formData.tipo_documento === 'cnpj' && docLimpo.length !== 14) {
      novosErros.cpf_cnpj = 'CNPJ deve ter 14 dígitos';
    }

    const telLimpo = formData.telefone.replace(/\D/g, '');
    if (!telLimpo) {
      novosErros.telefone = 'Telefone é obrigatório';
    } else if (telLimpo.length < 10 || telLimpo.length > 11) {
      novosErros.telefone = 'Telefone inválido';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validar()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    try {
      setLoading(true);
      
      const dados = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        cpf_cnpj: formData.cpf_cnpj,
        telefone: formData.telefone
      };

      const response = await cadastrarCliente(slug, dados);
      
      // Salvar token e dados
      login(response.token, response.usuario);
      
      toast.success('Conta criada com sucesso!');
      navigate(`/loja/${slug}`);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      const mensagem = error.response?.data?.erro || 'Erro ao criar conta';
      toast.error(mensagem);
      
      if (mensagem.includes('e-mail')) {
        setErros(prev => ({ ...prev, email: mensagem }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
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
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Logo/Nome */}
            <div className="text-center mb-8">
              {loja?.logo ? (
                <img 
                  src={loja.logo} 
                  alt={loja.nome_exibicao} 
                  className="h-14 mx-auto mb-4"
                />
              ) : (
                <div 
                  className="h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {loja?.nome_exibicao?.charAt(0) || 'L'}
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-800">
                Criar sua conta
              </h1>
              <p className="text-gray-500 mt-1">
                Cadastre-se em {loja?.nome_exibicao || 'nossa loja'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      erros.nome ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      erros.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {erros.email && <p className="text-red-500 text-xs mt-1">{erros.email}</p>}
              </div>

              {/* Tipo de Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de documento *
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => handleTipoDocumento('cpf')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      formData.tipo_documento === 'cpf'
                        ? 'text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    style={formData.tipo_documento === 'cpf' ? { backgroundColor: corPrimaria, borderColor: corPrimaria } : {}}
                  >
                    CPF (Pessoa Física)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTipoDocumento('cnpj')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      formData.tipo_documento === 'cnpj'
                        ? 'text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    style={formData.tipo_documento === 'cnpj' ? { backgroundColor: corPrimaria, borderColor: corPrimaria } : {}}
                  >
                    CNPJ (Empresa)
                  </button>
                </div>
              </div>

              {/* CPF/CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.tipo_documento === 'cpf' ? 'CPF' : 'CNPJ'} *
                </label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={handleChange}
                    placeholder={formData.tipo_documento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      erros.cpf_cnpj ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {erros.cpf_cnpj && <p className="text-red-500 text-xs mt-1">{erros.cpf_cnpj}</p>}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      erros.telefone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {erros.telefone && <p className="text-red-500 text-xs mt-1">{erros.telefone}</p>}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      erros.senha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {erros.senha && <p className="text-red-500 text-xs mt-1">{erros.senha}</p>}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar senha *
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    placeholder="Repita sua senha"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      erros.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {erros.confirmarSenha && <p className="text-red-500 text-xs mt-1">{erros.confirmarSenha}</p>}
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                style={{ backgroundColor: corPrimaria }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Criando conta...
                  </span>
                ) : (
                  'Criar conta'
                )}
              </button>
            </form>

            {/* Link Login */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  to={`/loja/${slug}/login`}
                  className="font-medium hover:underline"
                  style={{ color: corPrimaria }}
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;