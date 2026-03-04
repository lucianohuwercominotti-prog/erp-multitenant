import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { CarrinhoContext } from '../../context/CarrinhoContext';
import { AuthContext } from '../../context/AuthContext';

const Header = ({ loja }) => {
  const navigate = useNavigate();
  const { totalItens } = useContext(CarrinhoContext);
  const { usuario, logout } = useContext(AuthContext);
  
  const [menuAberto, setMenuAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const slug = loja?.slug || '';
  const corPrimaria = loja?.cor_primaria || '#3B82F6';
  const corSecundaria = loja?.cor_secundaria || '#1E40AF';

  const handleBusca = (e) => {
    e.preventDefault();
    if (busca.trim()) {
      navigate(`/loja/${slug}/produtos?busca=${encodeURIComponent(busca.trim())}`);
      setBusca('');
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownAberto(false);
    navigate(`/loja/${slug}`);
  };

  // Verifica se é cliente logado nesta loja
  const clienteLogado = usuario && usuario.tipo === 'cliente' && usuario.loja_id === loja?.id;

  return (
    <header 
      className="sticky top-0 z-50 shadow-md"
      style={{ backgroundColor: corPrimaria }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Nome da Loja */}
          <Link to={`/loja/${slug}`} className="flex items-center space-x-3">
            {loja?.logo ? (
              <img 
                src={loja.logo} 
                alt={loja.nome_exibicao} 
                className="h-10 w-auto object-contain bg-white rounded p-1"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: corSecundaria }}
              >
                {loja?.nome_exibicao?.charAt(0) || 'L'}
              </div>
            )}
            <span className="text-white font-bold text-lg hidden sm:block">
              {loja?.nome_exibicao || 'Loja'}
            </span>
          </Link>

          {/* Barra de Busca - Desktop */}
          <form onSubmit={handleBusca} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:outline-none"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Ações - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Telefone */}
            {loja?.telefone && (
              <a 
                href={`tel:${loja.telefone}`}
                className="flex items-center text-white hover:text-gray-200 text-sm"
              >
                <PhoneIcon className="h-4 w-4 mr-1" />
                <span>{loja.telefone}</span>
              </a>
            )}

            {/* Carrinho */}
            <Link 
              to={`/loja/${slug}/carrinho`}
              className="relative flex items-center text-white hover:text-gray-200"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {totalItens > 0 && (
                <span 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: corSecundaria, color: 'white' }}
                >
                  {totalItens > 99 ? '99+' : totalItens}
                </span>
              )}
            </Link>

            {/* Usuário */}
            {clienteLogado ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownAberto(!dropdownAberto)}
                  className="flex items-center text-white hover:text-gray-200"
                >
                  <UserIcon className="h-6 w-6 mr-1" />
                  <span className="text-sm max-w-24 truncate">
                    {usuario.nome?.split(' ')[0]}
                  </span>
                </button>
                
                {dropdownAberto && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {usuario.nome}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {usuario.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/loja/${slug}/login`}
                  className="text-white hover:text-gray-200 text-sm"
                >
                  Entrar
                </Link>
                <span className="text-white/50">|</span>
                <Link
                  to={`/loja/${slug}/cadastro`}
                  className="text-white hover:text-gray-200 text-sm"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="flex md:hidden items-center space-x-3">
            <Link 
              to={`/loja/${slug}/carrinho`}
              className="relative text-white"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {totalItens > 0 && (
                <span 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold bg-red-500 text-white"
                >
                  {totalItens > 99 ? '99+' : totalItens}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="text-white"
            >
              {menuAberto ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Busca Mobile */}
        <form onSubmit={handleBusca} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full pl-4 pr-10 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:outline-none text-sm"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Menu Mobile Expandido */}
      {menuAberto && (
        <div className="md:hidden border-t border-white/20" style={{ backgroundColor: corSecundaria }}>
          <div className="px-4 py-3 space-y-3">
            {loja?.telefone && (
              <a 
                href={`tel:${loja.telefone}`}
                className="flex items-center text-white text-sm"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                {loja.telefone}
              </a>
            )}
            
            <Link
              to={`/loja/${slug}/produtos`}
              className="block text-white text-sm"
              onClick={() => setMenuAberto(false)}
            >
              Ver Todos os Produtos
            </Link>

            {clienteLogado ? (
              <>
                <div className="text-white/80 text-sm">
                  Olá, {usuario.nome?.split(' ')[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-red-300 text-sm"
                >
                  Sair
                </button>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to={`/loja/${slug}/login`}
                  className="text-white text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Entrar
                </Link>
                <Link
                  to={`/loja/${slug}/cadastro`}
                  className="text-white text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;