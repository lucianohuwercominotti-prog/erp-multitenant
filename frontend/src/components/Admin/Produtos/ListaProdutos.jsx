import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const ListaProdutos = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal de confirmação
  const [modalExcluir, setModalExcluir] = useState(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [paginaAtual, categoriaFiltro, statusFiltro]);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      setCategorias(response.data.categorias || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pagina: paginaAtual,
        limit: 20
      });

      if (busca.trim()) {
        params.append('busca', busca.trim());
      }
      if (categoriaFiltro) {
        params.append('categoria_id', categoriaFiltro);
      }
      if (statusFiltro !== 'todos') {
        params.append('status', statusFiltro);
      }

      const response = await api.get(`/produtos?${params.toString()}`);
      setProdutos(response.data.produtos || []);
      setTotalPaginas(response.data.paginas || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleBusca = (e) => {
    e.preventDefault();
    setPaginaAtual(1);
    carregarProdutos();
  };

  const handleExcluir = async (id) => {
    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto excluído com sucesso');
      setModalExcluir(null);
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const getStatusBadge = (status) => {
    if (status === 'ativo') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>;
    }
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Inativo</span>;
  };

  const getEstoqueBadge = (atual, minimo) => {
    if (atual <= 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Sem estoque</span>;
    }
    if (atual <= minimo) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Estoque baixo</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{atual} un.</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-600">{total} produto(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link
            to="/admin/produtos/importar"
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Importar JSON
          </Link>
          <Link
            to="/admin/produtos/novo"
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleBusca} className="flex flex-col md:flex-row gap-4">
          {/* Busca por nome ou código */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por nome ou código (SKU)
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome ou código do produto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por categoria */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={categoriaFiltro}
              onChange={(e) => {
                setCategoriaFiltro(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro por status */}
          <div className="w-full md:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {/* Botão buscar */}
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de produtos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-4">
              {busca ? 'Tente buscar com outros termos' : 'Comece cadastrando seu primeiro produto'}
            </p>
            <Link
              to="/admin/produtos/novo"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Produto
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código (SKU)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      {/* Imagem */}
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {produto.imagem ? (
                            <img
                              src={produto.imagem}
                              alt={produto.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <EyeIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nome */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{produto.nome}</p>
                        </div>
                      </td>

                      {/* Código SKU */}
                      <td className="px-4 py-3">
                        <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                          {produto.codigo_sku}
                        </code>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3">
                        <span className="text-gray-600">
                          {produto.categoria_nome || 'Sem categoria'}
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {formatarPreco(produto.preco_venda)}
                        </span>
                      </td>

                      {/* Estoque */}
                      <td className="px-4 py-3">
                        {getEstoqueBadge(produto.estoque_atual, produto.estoque_minimo)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {getStatusBadge(produto.status)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/produtos/editar/${produto.id}`}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => setModalExcluir(produto)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Página {paginaAtual} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir o produto <strong>"{modalExcluir.nome}"</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalExcluir(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExcluir(modalExcluir.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaProdutos;