import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  MinusIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { buscarProdutoPublico } from '../../services/api';
import { CarrinhoContext } from '../../context/CarrinhoContext';
import toast from 'react-hot-toast';

const ProdutoDetalhes = ({ loja }) => {
  const { slug, produtoId } = useParams();
  const { adicionarItem } = useContext(CarrinhoContext);

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantidade, setQuantidade] = useState(1);
  const [imagemAmpliada, setImagemAmpliada] = useState(false);

  const corPrimaria = loja?.cor_primaria || '#3B82F6';
  const corSecundaria = loja?.cor_secundaria || '#1E40AF';

  useEffect(() => {
    carregarProduto();
  }, [slug, produtoId]);

  const carregarProduto = async () => {
    try {
      setLoading(true);
      const response = await buscarProdutoPublico(slug, produtoId);
      setProduto(response.produto || response);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Produto não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantidadeChange = (valor) => {
    const novaQuantidade = quantidade + valor;
    if (novaQuantidade >= 1 && novaQuantidade <= (produto?.estoque_atual || 1)) {
      setQuantidade(novaQuantidade);
    }
  };

  const handleInputQuantidade = (e) => {
    const valor = parseInt(e.target.value) || 1;
    if (valor >= 1 && valor <= (produto?.estoque_atual || 1)) {
      setQuantidade(valor);
    }
  };

  const handleAdicionarCarrinho = () => {
    if (!produto || produto.estoque_atual <= 0) {
      toast.error('Produto sem estoque');
      return;
    }

    adicionarItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco: parseFloat(produto.preco_venda),
      quantidade: quantidade,
      imagem: produto.imagem,
      estoque: produto.estoque_atual
    });

    toast.success(`${quantidade} ${quantidade > 1 ? 'unidades adicionadas' : 'unidade adicionada'} ao carrinho!`);
  };

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: corPrimaria }}></div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <XMarkIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Produto não encontrado</h2>
        <p className="text-gray-500 mb-4">Este produto pode ter sido removido ou não existe.</p>
        <Link
          to={`/loja/${slug}/produtos`}
          className="flex items-center text-sm font-medium hover:underline"
          style={{ color: corPrimaria }}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const estoqueDisponivel = produto.estoque_atual > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <Link to={`/loja/${slug}`} className="hover:text-gray-700">
              Início
            </Link>
            <span className="mx-2">/</span>
            <Link to={`/loja/${slug}/produtos`} className="hover:text-gray-700">
              Produtos
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 truncate max-w-xs">{produto.nome}</span>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            
            {/* Coluna da Imagem */}
            <div>
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in relative"
                onClick={() => produto.imagem && setImagemAmpliada(true)}
              >
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCartIcon className="h-24 w-24 text-gray-300" />
                  </div>
                )}
                
                {/* Badge de Estoque */}
                {!estoqueDisponivel && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                      Produto Esgotado
                    </span>
                  </div>
                )}
              </div>

              {/* Clique para ampliar */}
              {produto.imagem && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Clique na imagem para ampliar
                </p>
              )}
            </div>

            {/* Coluna de Informações */}
            <div className="flex flex-col">
              {/* Categoria */}
              {produto.categoria_nome && (
                <Link 
                  to={`/loja/${slug}/produtos?categoria=${produto.categoria_id}`}
                  className="text-sm mb-2 hover:underline"
                  style={{ color: corPrimaria }}
                >
                  {produto.categoria_nome}
                </Link>
              )}

              {/* Nome */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                {produto.nome}
              </h1>

              {/* SKU */}
              <p className="text-sm text-gray-500 mb-4">
                Código: {produto.codigo_sku}
              </p>

              {/* Preço */}
              <div className="mb-6">
                <span 
                  className="text-3xl lg:text-4xl font-bold"
                  style={{ color: corPrimaria }}
                >
                  {formatarPreco(produto.preco_venda)}
                </span>
              </div>

              {/* Descrição */}
              {produto.descricao && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Descrição</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {produto.descricao}
                  </p>
                </div>
              )}

              {/* Estoque */}
              <div className="mb-6">
                <div className="flex items-center">
                  {estoqueDisponivel ? (
                    <>
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">
                        {produto.estoque_atual} {produto.estoque_atual === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                      </span>
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-600 font-medium">
                        Produto indisponível
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantidade e Botão */}
              {estoqueDisponivel && (
                <div className="mt-auto space-y-4">
                  {/* Seletor de Quantidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantidadeChange(-1)}
                        disabled={quantidade <= 1}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      
                      <input
                        type="number"
                        value={quantidade}
                        onChange={handleInputQuantidade}
                        min="1"
                        max={produto.estoque_atual}
                        className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': corPrimaria }}
                      />
                      
                      <button
                        onClick={() => handleQuantidadeChange(1)}
                        disabled={quantidade >= produto.estoque_atual}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Botão Adicionar */}
                  <button
                    onClick={handleAdicionarCarrinho}
                    className="w-full py-4 text-white rounded-lg font-semibold text-lg flex items-center justify-center transition-opacity hover:opacity-90"
                    style={{ backgroundColor: corPrimaria }}
                  >
                    <ShoppingCartIcon className="h-6 w-6 mr-2" />
                    Adicionar ao Carrinho
                  </button>

                  {/* Subtotal */}
                  <p className="text-center text-gray-600">
                    Subtotal: <span className="font-semibold">{formatarPreco(produto.preco_venda * quantidade)}</span>
                  </p>
                </div>
              )}

              {/* Botão quando esgotado */}
              {!estoqueDisponivel && loja?.whatsapp && (
                <div className="mt-auto">
                  <a
                    href={`https://api.whatsapp.com/send?phone=55${loja.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(`Olá! Gostaria de saber quando o produto "${produto.nome}" (${produto.codigo_sku}) estará disponível.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-green-500 text-white rounded-lg font-semibold text-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Avise-me quando disponível
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voltar */}
        <div className="mt-6">
          <Link
            to={`/loja/${slug}/produtos`}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para produtos
          </Link>
        </div>
      </div>

      {/* Modal de Imagem Ampliada */}
      {imagemAmpliada && produto.imagem && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImagemAmpliada(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setImagemAmpliada(false)}
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ProdutoDetalhes;