import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { buscarLojaPorSlug } from '../services/api';
import { CarrinhoProvider } from '../context/CarrinhoContext';

// Componentes do Site Público
import Header from '../components/SitePublico/Header';
import Footer from '../components/SitePublico/Footer';
import Home from '../components/SitePublico/Home';
import ListaProdutos from '../components/SitePublico/ListaProdutos';
import ProdutoDetalhes from '../components/SitePublico/ProdutoDetalhes';
import Login from '../components/SitePublico/Login';
import Cadastro from '../components/SitePublico/Cadastro';
import Carrinho from '../components/SitePublico/Carrinho';

const SiteLoja = () => {
  const { slug } = useParams();
  const [loja, setLoja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarLoja();
  }, [slug]);

  const carregarLoja = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await buscarLojaPorSlug(slug);
      setLoja(response.loja || response);
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      setErro('Loja não encontrada');
    } finally {
      setLoading(false);
    }
  };

  // Tela de Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando loja...</p>
        </div>
      </div>
    );
  }

  // Tela de Erro / Loja não encontrada
  if (erro || !loja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Loja não encontrada
          </h1>
          <p className="text-gray-500 mb-6">
            Não conseguimos encontrar uma loja com o endereço "{slug}". 
            Verifique o link e tente novamente.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ir para página inicial
          </a>
        </div>
      </div>
    );
  }

  // Loja suspensa ou cancelada
  if (loja.status !== 'ativa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Loja temporariamente indisponível
          </h1>
          <p className="text-gray-500 mb-6">
            Esta loja está temporariamente fora do ar. 
            Por favor, tente novamente mais tarde.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ir para página inicial
          </a>
        </div>
      </div>
    );
  }

  return (
    <CarrinhoProvider slugLoja={slug}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Routes>
          {/* Rotas SEM Header/Footer (Login e Cadastro) */}
          <Route path="/login" element={<Login loja={loja} />} />
          <Route path="/cadastro" element={<Cadastro loja={loja} />} />
          
          {/* Rotas COM Header/Footer */}
          <Route
            path="/*"
            element={
              <>
                <Header loja={loja} />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home loja={loja} />} />
                    <Route path="/produtos" element={<ListaProdutos loja={loja} />} />
                    <Route path="/produto/:produtoId" element={<ProdutoDetalhes loja={loja} />} />
                    <Route path="/carrinho" element={<Carrinho loja={loja} />} />
                    {/* Redirect para home em rotas não encontradas */}
                    <Route path="*" element={<Navigate to={`/loja/${slug}`} replace />} />
                  </Routes>
                </main>
                <Footer loja={loja} />
              </>
            }
          />
        </Routes>
      </div>
    </CarrinhoProvider>
  );
};

export default SiteLoja;