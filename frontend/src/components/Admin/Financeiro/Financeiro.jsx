import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const Financeiro = () => {
  const [abaAtiva, setAbaAtiva] = useState('pagar');
  const [contas, setContas] = useState([]);
  const [totais, setTotais] = useState({});
  const [fluxoCaixa, setFluxoCaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null);
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    categoria: '',
    observacoes: ''
  });

  const categoriasPagar = ['aluguel', 'fornecedores', 'impostos', 'salarios', 'energia', 'agua', 'internet', 'outros'];
  const categoriasReceber = ['vendas', 'servicos', 'outros'];

  useEffect(() => {
    carregarDados();
  }, [abaAtiva, filtroStatus]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      if (abaAtiva === 'pagar') {
        const params = new URLSearchParams();
        if (filtroStatus !== 'todas') params.append('status', filtroStatus);
        const response = await api.get(`/financeiro/contas-a-pagar?${params.toString()}`);
        setContas(response.data.contas || []);
        setTotais(response.data.totais || {});
      } else if (abaAtiva === 'receber') {
        const params = new URLSearchParams();
        if (filtroStatus !== 'todas') params.append('status', filtroStatus);
        const response = await api.get(`/financeiro/contas-a-receber?${params.toString()}`);
        setContas(response.data.contas || []);
        setTotais(response.data.totais || {});
      } else {
        const response = await api.get('/financeiro/fluxo-caixa?periodo=30');
        setFluxoCaixa(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
    setLoading(false);
  };

  const abrirModal = (conta = null) => {
    if (conta) {
      setContaEditando(conta);
      setFormData({
        descricao: conta.descricao,
        valor: conta.valor,
        data_vencimento: conta.data_vencimento?.split('T')[0] || '',
        categoria: conta.categoria || '',
        observacoes: conta.observacoes || ''
      });
    } else {
      setContaEditando(null);
      setFormData({ descricao: '', valor: '', data_vencimento: '', categoria: '', observacoes: '' });
    }
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = abaAtiva === 'pagar' ? '/financeiro/contas-a-pagar' : '/financeiro/contas-a-receber';
      if (contaEditando) {
        await api.put(`${endpoint}/${contaEditando.id}`, formData);
        toast.success('Conta atualizada');
      } else {
        await api.post(endpoint, formData);
        toast.success('Conta criada');
      }
      setModalAberto(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const marcarComoPaga = async (conta) => {
    try {
      if (abaAtiva === 'pagar') {
        await api.put(`/financeiro/contas-a-pagar/${conta.id}/pagar`);
        toast.success('Conta paga');
      } else {
        await api.put(`/financeiro/contas-a-receber/${conta.id}/receber`);
        toast.success('Conta recebida');
      }
      carregarDados();
    } catch (error) {
      toast.error('Erro');
    }
  };

  const excluirConta = async (id) => {
    try {
      const endpoint = abaAtiva === 'pagar' ? '/financeiro/contas-a-pagar' : '/financeiro/contas-a-receber';
      await api.delete(`${endpoint}/${id}`);
      toast.success('Excluída');
      setModalExcluir(null);
      carregarDados();
    } catch (error) {
      toast.error('Erro');
    }
  };

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR') : '-';

  const getStatusBadge = (conta) => {
    const cores = {
      'paga': 'bg-green-100 text-green-800',
      'recebida': 'bg-green-100 text-green-800',
      'a_vencer': 'bg-blue-100 text-blue-800',
      'a_receber': 'bg-blue-100 text-blue-800',
      'vencida': 'bg-red-100 text-red-800'
    };
    const textos = {
      'paga': 'Paga', 'recebida': 'Recebida', 'a_vencer': 'A Vencer', 'a_receber': 'A Receber', 'vencida': 'Vencida'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cores[conta.status]}`}>{textos[conta.status]}</span>;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
        <p className="text-gray-600">Gerencie contas a pagar e receber</p>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b flex">
          <button onClick={() => { setAbaAtiva('pagar'); setFiltroStatus('todas'); }}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'pagar' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'}`}>
            <ArrowTrendingDownIcon className="h-5 w-5 mr-2" /> Contas a Pagar
          </button>
          <button onClick={() => { setAbaAtiva('receber'); setFiltroStatus('todas'); }}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'receber' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2" /> Contas a Receber
          </button>
          <button onClick={() => setAbaAtiva('fluxo')}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'fluxo' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <BanknotesIcon className="h-5 w-5 mr-2" /> Fluxo de Caixa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      ) : abaAtiva === 'fluxo' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-500">Total Entradas</p>
              <p className="text-2xl font-bold text-green-600">{formatarMoeda(fluxoCaixa?.total_entradas)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-500">Total Saídas</p>
              <p className="text-2xl font-bold text-red-600">{formatarMoeda(fluxoCaixa?.total_saidas)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-2xl font-bold ${(fluxoCaixa?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatarMoeda(fluxoCaixa?.saldo)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b"><h3 className="font-semibold">Movimentações (30 dias)</h3></div>
            <div className="divide-y">
              {fluxoCaixa?.movimentacoes?.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma movimentação</div>
              ) : fluxoCaixa?.movimentacoes?.map((mov, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {mov.tipo === 'entrada' ? <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" /> : <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</p>
                      <p className="text-sm text-gray-500">{formatarData(mov.data)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {mov.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(mov.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">{abaAtiva === 'pagar' ? 'A Vencer' : 'A Receber'}</p>
              <p className="text-2xl font-bold">{formatarMoeda(abaAtiva === 'pagar' ? totais.total_a_vencer : totais.total_a_receber)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
              <p className="text-sm text-gray-500">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{formatarMoeda(totais.total_vencidas)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">{abaAtiva === 'pagar' ? 'Pagas' : 'Recebidas'}</p>
              <p className="text-2xl font-bold text-green-600">{formatarMoeda(abaAtiva === 'pagar' ? totais.total_pagas : totais.total_recebidas)}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center flex-wrap gap-4">
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="todas">Todas</option>
              {abaAtiva === 'pagar' ? (
                <><option value="a_vencer">A Vencer</option><option value="vencida">Vencidas</option><option value="paga">Pagas</option></>
              ) : (
                <><option value="a_receber">A Receber</option><option value="vencida">Vencidas</option><option value="recebida">Recebidas</option></>
              )}
            </select>
            <button onClick={() => abrirModal()}
              className={`flex items-center px-4 py-2 text-white rounded-lg ${abaAtiva === 'pagar' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
              <PlusIcon className="h-5 w-5 mr-2" /> Nova Conta
            </button>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {contas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhuma conta encontrada</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contas.map((conta) => (
                    <tr key={conta.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{conta.descricao}</td>
                      <td className="px-4 py-3 font-semibold">{formatarMoeda(conta.valor)}</td>
                      <td className="px-4 py-3">{formatarData(conta.data_vencimento)}</td>
                      <td className="px-4 py-3">{getStatusBadge(conta)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {(conta.status === 'a_vencer' || conta.status === 'a_receber' || conta.status === 'vencida') && (
                            <button onClick={() => marcarComoPaga(conta)} className="p-2 text-green-500 hover:bg-green-50 rounded"><CheckCircleIcon className="h-5 w-5" /></button>
                          )}
                          <button onClick={() => abrirModal(conta)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><PencilSquareIcon className="h-5 w-5" /></button>
                          <button onClick={() => setModalExcluir(conta)} className="p-2 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{contaEditando ? 'Editar' : 'Nova'} Conta</h3>
              <button onClick={() => setModalAberto(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <input type="text" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor *</label>
                <input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vencimento *</label>
                <input type="date" value={formData.data_vencimento} onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecione...</option>
                  {(abaAtiva === 'pagar' ? categoriasPagar : categoriasReceber).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" rows="2" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg ${abaAtiva === 'pagar' ? 'bg-red-500' : 'bg-green-500'}`}>
                  {contaEditando ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-2">Confirmar exclusão</h3>
            <p className="text-gray-600 mb-4">Excluir "{modalExcluir.descricao}"?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalExcluir(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={() => excluirConta(modalExcluir.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;