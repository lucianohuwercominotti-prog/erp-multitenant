import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, CubeIcon, TagIcon, ShoppingCartIcon, DocumentTextIcon, UsersIcon,
  BanknotesIcon, ArchiveBoxIcon, Cog6ToothIcon, ChevronDownIcon, ChevronRightIcon,
  CloudArrowUpIcon, PlusIcon, ClipboardDocumentListIcon, ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const [menusAbertos, setMenusAbertos] = useState({
    produtos: location.pathname.includes('/admin/produtos'),
    vendas: location.pathname.includes('/admin/vendas')
  });

  const toggleMenu = (menu) => setMenusAbertos(prev => ({ ...prev, [menu]: !prev[menu] }));
  const isActive = (href) => location.pathname === href;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/admin/login';
  };

  const MenuItem = ({ to, icon: Icon, children, indent = false }) => (
    <Link to={to}
      className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive(to) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'} ${indent ? 'ml-4 text-sm' : ''}`}>
      <Icon className={`${indent ? 'h-4 w-4' : 'h-5 w-5'} mr-3`} />
      {children}
    </Link>
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-40 overflow-y-auto">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold">ERP Multi-Tenant</h1>
        <p className="text-gray-400 text-xs mt-1">Sistema de Gestão</p>
      </div>

      <nav className="p-3 space-y-1">
        <MenuItem to="/admin/dashboard" icon={HomeIcon}>Dashboard</MenuItem>

        {/* Produtos */}
        <div className="mb-1">
          <button onClick={() => toggleMenu('produtos')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg ${location.pathname.includes('/admin/produtos') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            <div className="flex items-center"><CubeIcon className="h-5 w-5 mr-3" />Produtos</div>
            {menusAbertos.produtos ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </button>
          {menusAbertos.produtos && (
            <div className="mt-1 space-y-1">
              <MenuItem to="/admin/produtos" icon={ClipboardDocumentListIcon} indent>Listar</MenuItem>
              <MenuItem to="/admin/produtos/novo" icon={PlusIcon} indent>Novo</MenuItem>
              <MenuItem to="/admin/produtos/importar" icon={CloudArrowUpIcon} indent>Importar JSON</MenuItem>
            </div>
          )}
        </div>

        <MenuItem to="/admin/categorias" icon={TagIcon}>Categorias</MenuItem>
        <MenuItem to="/admin/estoque" icon={ArchiveBoxIcon}>Estoque</MenuItem>

        {/* Vendas */}
        <div className="mb-1">
          <button onClick={() => toggleMenu('vendas')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg ${location.pathname.includes('/admin/vendas') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
            <div className="flex items-center"><ShoppingCartIcon className="h-5 w-5 mr-3" />Vendas</div>
            {menusAbertos.vendas ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </button>
          {menusAbertos.vendas && (
            <div className="mt-1 space-y-1">
              <MenuItem to="/admin/vendas" icon={PlusIcon} indent>Nova (PDV)</MenuItem>
              <MenuItem to="/admin/vendas/historico" icon={ClipboardDocumentListIcon} indent>Histórico</MenuItem>
            </div>
          )}
        </div>

        <MenuItem to="/admin/orcamentos" icon={DocumentTextIcon}>Orçamentos</MenuItem>
        <MenuItem to="/admin/clientes" icon={UsersIcon}>Clientes</MenuItem>
        <MenuItem to="/admin/financeiro" icon={BanknotesIcon}>Financeiro</MenuItem>
        <MenuItem to="/admin/nfe" icon={DocumentDuplicateIcon}>Notas Fiscais</MenuItem>
        <MenuItem to="/admin/configuracoes" icon={Cog6ToothIcon}>Configurações</MenuItem>

        <div className="pt-4 mt-4 border-t border-gray-700">
          <button onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30">
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />Sair
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;