import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { listarProdutosPublicos, listarCategoriasPublicas } from '../../services/api';
import { CarrinhoContext } from '../../context/CarrinhoContext';
import toast from 'react-hot-toast';

const ListaProdutos = ({ loja }) => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { adicionarItem } = useContext(CarrinhoContext);

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [paginacao, setPaginacao] = useState({ total: 0, paginas: 1, atual: 1 });

  // Filtros
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [categoriaId, setCategoriaId] = useState(searchParams.get('categoria') || '');
  const [ordenacao, setOrdenacao] = useState(searchParams.get('ordem') || 'recentes');

  const corPrimaria = loja?.cor_primaria || '#3B82F6';
  const corSecundaria = loja?.cor_secundaria || '#1E40AF';

  useEffect(() => {
    carregarCategorias();
  }, [slug]);

  useEffect(() => {
    carregarProdutos();
  }, [slug, searchParams]);

  const carregarCategorias = async () => {
    try {
      const response = await listarCategoriasPublicas(slug);
      setCategorias(response.categorias || response || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const params = {
        busca: searchParams.get('busca') || '',
        categoria_id: searchParams.get('categoria') || '',
        ordem: searchParams.get('ordem') || 'recentes',
        pagina: searchParams.get('pagina') || 1,
        limit: 12
      };
      
      const response = await listarProdutosPublicos(slug, params);
      setProdutos(response.produtos || response || []);
      setPaginacao({
        total: response.total || 0,
        paginas: response.paginas || 1,
        atual: response.pagina_atual || 1
      });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    const params = new URLSearchParams();
    if (busca.trim()) params.set('busca', busca.trim());
    if (categoriaId) params.set('categoria', categoriaId);
    if (ordenacao !== 'recentes') params.set('ordem', ordenacao);
    params.set('pagina', '1');
    setSearchParams(params);
    setFiltrosAbertos(false);
  };

  const limparFiltros = () => {
    setBusca('');
    setCategoriaId('');
    setOrdenacao('recentes');
    setSearchParams({});
  };

  const mudarPagina = (novaPagina) => {
    const params = new URLSearchParams(searchParams);
    params.set('pagina', novaPagina.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const temFiltrosAtivos = searchParams.get('busca') || searchParams.get('categoria') || searchParams.get('ordem');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Página */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800">Nossos Produtos</h1>
          <p className="text-gray-500 mt-1">
            {paginacao.total} produto{paginacao.total !== 1 ? 's' : ''} encontrado{paginacao.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar de Filtros - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtros
              </h2>

              {/* Busca */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                    placeholder="Nome do produto..."
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': corPrimaria }}
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Categoria */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                >
                  <option value="recentes">Mais Recentes</option>
                  <option value="menor_preco">Menor Preço</option>
                  <option value="maior_preco">Maior Preço</option>
                  <option value="nome_az">Nome A-Z</option>
                </select>
              </div>

              {/* Botões */}
              <div className="space-y-2">
                <button
                  onClick={aplicarFiltros}
                  className="w-full py-2 text-white rounded-lg text-sm font-medium"
                  style={{ backgroundColor: corPrimaria }}
                >
                  Aplicar Filtros
                </button>
                {temFiltrosAtivos && (
                  <button
                    onClick={limparFiltros}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Botão Filtros Mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <button
              onClick={() => setFiltrosAbertos(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros
              {temFiltrosAtivos && (
                <span 
                  className="ml-2 px-2 py-0.5 rounded-full text-xs text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  Ativos
                </span>
              )}
            </button>
            <select
              value={ordenacao}
              onChange={(e) => {
                setOrdenacao(e.target.value);
                const params = new URLSearchParams(searchParams);
                params.set('ordem', e.target.value);
                setSearchParams(params);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="menor_preco">Menor Preço</option>
              <option value="maior_preco">Maior Preço</option>
              <option value="nome_az">Nome A-Z</option>
            </select>
          </div>

          {/* Modal Filtros Mobile */}
          {filtrosAbertos && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFiltrosAbertos(false)} />
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-lg">Filtros</h2>
                  <button onClick={() => setFiltrosAbertos(false)}>
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* Mesmos filtros do desktop */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Nome do produto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Todas</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 mt-6">
                  <button
                    onClick={aplicarFiltros}
                    className="w-full py-3 text-white rounded-lg font-medium"
                    style={{ backgroundColor: corPrimaria }}
                  >
                    Aplicar Filtros
                  </button>
                  {temFiltrosAtivos && (
                    <button
                      onClick={() => { limparFiltros(); setFiltrosAbertos(false); }}
                      className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grid de Produtos */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: corPrimaria }}></div>
              </div>
            ) : produtos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ShoppingCartIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
                {temFiltrosAtivos && (
                  <button
                    onClick={limparFiltros}
                    className="text-sm font-medium hover:underline"
                    style={{ color: corPrimaria }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {produtos.map((produto) => (
                    <div 
                      key={produto.id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                    >
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

                      <div className="p-4">
                        <Link to={`/loja/${slug}/produto/${produto.id}`}>
                          <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 hover:underline text-sm">
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
                          style={{ backgroundColor: produto.estoque_atual > 0 ? corPrimaria : undefined }}
                        >
                          <ShoppingCartIcon className="h-4 w-4 mr-2" />
                          {produto.estoque_atual > 0 ? 'Adicionar' : 'Indisponível'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {paginacao.paginas > 1 && (
                  <div className="flex items-center justify-center mt-8 space-x-2">
                    <button
                      onClick={() => mudarPagina(paginacao.atual - 1)}
                      disabled={paginacao.atual === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: paginacao.paginas }, (_, i) => i + 1)
                      .filter(p => Math.abs(p - paginacao.atual) <= 2 || p === 1 || p === paginacao.paginas)
                      .map((pagina, idx, arr) => (
                        <React.Fragment key={pagina}>
                          {idx > 0 && arr[idx - 1] !== pagina - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => mudarPagina(pagina)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium ${
                              pagina === paginacao.atual
                                ? 'text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                            style={pagina === paginacao.atual ? { backgroundColor: corPrimaria } : {}}
                          >
                            {pagina}
                          </button>
                        </React.Fragment>
                      ))}
                    
                    <button
                      onClick={() => mudarPagina(paginacao.atual + 1)}
                      disabled={paginacao.atual === paginacao.paginas}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaProdutos;