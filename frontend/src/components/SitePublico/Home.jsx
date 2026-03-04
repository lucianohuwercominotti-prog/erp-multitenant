import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  TagIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { listarProdutosPublicos, listarCategoriasPublicas } from '../../services/api';
import { CarrinhoContext } from '../../context/CarrinhoContext';
import toast from 'react-hot-toast';

const Home = ({ loja }) => {
  const { slug } = useParams();
  const { adicionarItem } = useContext(CarrinhoContext);
  
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const corPrimaria = loja?.cor_primaria || '#3B82F6';
  const corSecundaria = loja?.cor_secundaria || '#1E40AF';

  useEffect(() => {
    carregarDados();
  }, [slug]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [produtosRes, categoriasRes] = await Promise.all([
        listarProdutosPublicos(slug, { limit: 12 }),
        listarCategoriasPublicas(slug)
      ]);
      setProdutos(produtosRes.produtos || produtosRes || []);
      setCategorias(categoriasRes.categorias || categoriasRes || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarCarrinho = (produto) => {
    if (produto.estoque_atual <= 0) {
      toast.error('Produto sem estoque');
      return;
    }
    adicionarItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco: parseFloat(produto.preco_venda),
      quantidade: 1,
      imagem: produto.imagem,
      estoque: produto.estoque_atual
    });
    toast.success('Produto adicionado ao carrinho!');
  };

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: corPrimaria }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Hero */}
      <section 
        className="py-16 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)` 
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Bem-vindo à {loja?.nome_exibicao || 'Nossa Loja'}
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-8">
            Encontre os melhores produtos com os melhores preços
          </p>
          <Link
            to={`/loja/${slug}/produtos`}
            className="inline-flex items-center px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Ver Todos os Produtos
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Categorias */}
      {categorias.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <TagIcon className="h-6 w-6 mr-2" style={{ color: corPrimaria }} />
              Categorias
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categorias.map((categoria) => (
                <Link
                  key={categoria.id}
                  to={`/loja/${slug}/produtos?categoria=${categoria.id}`}
                  className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: `${corPrimaria}20` }}
                  >
                    <TagIcon className="h-6 w-6" style={{ color: corPrimaria }} />
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">
                    {categoria.nome}
                  </h3>
                  {categoria.total_produtos !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      {categoria.total_produtos} produto{categoria.total_produtos !== 1 ? 's' : ''}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Produtos em Destaque */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Produtos em Destaque
            </h2>
            <Link
              to={`/loja/${slug}/produtos`}
              className="text-sm font-medium flex items-center hover:underline"
              style={{ color: corPrimaria }}
            >
              Ver todos
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum produto disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {produtos.map((produto) => (
                <div 
                  key={produto.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Imagem */}
                  <Link to={`/loja/${slug}/produto/${produto.id}`}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {produto.imagem ? (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCartIcon className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      {produto.estoque_atual <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Esgotado
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link to={`/loja/${slug}/produto/${produto.id}`}>
                      <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 hover:underline">
                        {produto.nome}
                      </h3>
                    </Link>
                    
                    {produto.categoria_nome && (
                      <p className="text-xs text-gray-500 mb-2">
                        {produto.categoria_nome}
                      </p>
                    )}
                    
                    <p 
                      className="text-lg font-bold mb-3"
                      style={{ color: corPrimaria }}
                    >
                      {formatarPreco(produto.preco_venda)}
                    </p>

                    <button
                      onClick={() => handleAdicionarCarrinho(produto)}
                      disabled={produto.estoque_atual <= 0}
                      className="w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      style={{ 
                        backgroundColor: produto.estoque_atual > 0 ? corPrimaria : undefined 
                      }}
                    >
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      {produto.estoque_atual > 0 ? 'Adicionar' : 'Indisponível'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Não encontrou o que procura?
          </h2>
          <p className="text-gray-600 mb-6">
            Entre em contato conosco pelo WhatsApp e teremos prazer em ajudá-lo.
          </p>
          {loja?.whatsapp && (
            <a
              href={`https://api.whatsapp.com/send?phone=55${loja.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent('Olá! Gostaria de mais informações sobre os produtos.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar pelo WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;