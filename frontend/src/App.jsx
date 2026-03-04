import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginAdmin from './pages/LoginAdmin';
import CadastroAdmin from './pages/CadastroAdmin';

import PainelAdmin from './pages/PainelAdmin';
import Dashboard from './components/Admin/Dashboard';
import ListaProdutos from './components/Admin/Produtos/ListaProdutos';
import FormProduto from './components/Admin/Produtos/FormProduto';
import ImportarJSON from './components/Admin/Produtos/ImportarJSON';
import Categorias from './components/Admin/Categorias';
import VisaoGeralEstoque from './components/Admin/Estoque/VisaoGeralEstoque';
import PDV from './components/Admin/Vendas/PDV';
import ListaVendas from './components/Admin/Vendas/ListaVendas';
import ListaOrcamentos from './components/Admin/Orcamentos/ListaOrcamentos';
import ListaClientes from './components/Admin/Clientes/ListaClientes';
import Financeiro from './components/Admin/Financeiro/Financeiro';
import NotasFiscais from './components/Admin/NFe/NotasFiscais';
import Configuracoes from './components/Admin/Configuracoes';

import SiteLoja from './pages/SiteLoja';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route path="/admin/cadastro" element={<CadastroAdmin />} />

          <Route path="/admin" element={<PainelAdmin />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="produtos" element={<ListaProdutos />} />
            <Route path="produtos/novo" element={<FormProduto />} />
            <Route path="produtos/editar/:id" element={<FormProduto />} />
            <Route path="produtos/importar" element={<ImportarJSON />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="estoque" element={<VisaoGeralEstoque />} />
            <Route path="vendas" element={<PDV />} />
            <Route path="vendas/historico" element={<ListaVendas />} />
            <Route path="orcamentos" element={<ListaOrcamentos />} />
            <Route path="clientes" element={<ListaClientes />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="nfe" element={<NotasFiscais />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="/loja/:slug/*" element={<SiteLoja />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;