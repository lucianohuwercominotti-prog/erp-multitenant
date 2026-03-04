import React, { useState, useEffect } from 'react';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const NotasFiscais = () => {
  const [abaAtiva, setAbaAtiva] = useState('saida');
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [formEntrada, setFormEntrada] = useState({
    fornecedor: '', numero_nfe: '', serie: '1', data_emissao: '', observacoes: '', itens: []
  });

  const [formSaida, setFormSaida] = useState({
    cliente_id: '', observacoes: '', itens: []
  });

  const [itemTemp, setItemTemp] = useState({ produto_id: '', quantidade: 1, preco_unitario: '' });

  useEffect(() => {
    carregarNotas();
    carregarProdutos();
    carregarClientes();
  }, [abaAtiva]);

  const carregarNotas = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/nfe?tipo=${abaAtiva}`);
      setNotas(response.data.notas || []);
    } catch (error) {
      toast.error('Erro ao carregar notas');
    }
    setLoading(false);
  };

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data.produtos || []);
    } catch (error) {}
  };

  const carregarClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data.clientes || []);
    } catch (error) {}
  };

  const adicionarItem = (form, setForm) => {
    if (!itemTemp.produto_id || !itemTemp.quantidade || !itemTemp.preco_unitario) {
      toast.error('Preencha todos os campos do item');
      return;
    }
    const produto = produtos.find(p => p.id === parseInt(itemTemp.produto_id));
    setForm({
      ...form,
      itens: [...form.itens, { ...itemTemp, produto_nome: produto?.nome, subtotal: itemTemp.quantidade * itemTemp.preco_unitario }]
    });
    setItemTemp({ produto_id: '', quantidade: 1, preco_unitario: '' });
  };

  const removerItem = (index, form, setForm) => {
    setForm({ ...form, itens: form.itens.filter((_, i) => i !== index) });
  };

  const handleEntrada = async (e) => {
    e.preventDefault();
    if (formEntrada.itens.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    try {
      await api.post('/nfe/entrada', formEntrada);
      toast.success('NF-e entrada registrada');
      setModalEntrada(false);
      setFormEntrada({ fornecedor: '', numero_nfe: '', serie: '1', data_emissao: '', observacoes: '', itens: [] });
      carregarNotas();
    } catch (error) {
      toast.error('Erro ao registrar');
    }
  };

  const handleSaida = async (e) => {
    e.preventDefault();
    if (!formSaida.cliente_id || formSaida.itens.length === 0) {
      toast.error('Selecione cliente e adicione itens');
      return;
    }
    try {
      const response = await api.post('/nfe/saida', formSaida);
      toast.success(`NF-e ${response.data.numero} emitida`);
      setModalSaida(false);
      setFormSaida({ cliente_id: '', observacoes: '', itens: [] });
      carregarNotas();
    } catch (error) {
      toast.error('Erro ao emitir');
    }
  };

  const verDetalhes = async (id) => {
    try {
      const response = await api.get(`/nfe/${id}`);
      setModalDetalhes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
    }
  };

  const cancelarNfe = async (id) => {
    if (!window.confirm('Cancelar esta NF-e?')) return;
    try {
      await api.delete(`/nfe/${id}`);
      toast.success('NF-e cancelada');
      carregarNotas();
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
  };

  const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notas Fiscais</h1>
        <p className="text-gray-600">Gerencie NF-e de entrada e saída</p>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b flex">
          <button onClick={() => setAbaAtiva('saida')}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'saida' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> NF-e Saída
          </button>
          <button onClick={() => setAbaAtiva('entrada')}
            className={`px-6 py-4 font-medium flex items-center border-b-2 ${abaAtiva === 'entrada' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> NF-e Entrada
          </button>
        </div>
      </div>

      {/* Botão Nova NF-e */}
      <div className="mb-6">
        <button onClick={() => abaAtiva === 'entrada' ? setModalEntrada(true) : setModalSaida(true)}
          className={`flex items-center px-4 py-2 text-white rounded-lg ${abaAtiva === 'entrada' ? 'bg-green-500' : 'bg-blue-500'}`}>
          <PlusIcon className="h-5 w-5 mr-2" /> Nova NF-e {abaAtiva === 'entrada' ? 'Entrada' : 'Saída'}
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
        ) : notas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma nota encontrada</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{abaAtiva === 'entrada' ? 'Fornecedor' : 'Cliente'}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notas.map((nota) => (
                <tr key={nota.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{nota.numero_nfe}</td>
                  <td className="px-4 py-3">{nota.fornecedor || nota.cliente_nome || '-'}</td>
                  <td className="px-4 py-3">{formatarData(nota.data_emissao)}</td>
                  <td className="px-4 py-3 font-semibold">{formatarMoeda(nota.valor_total)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${nota.status === 'emitida' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {nota.status === 'emitida' ? 'Emitida' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => verDetalhes(nota.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><EyeIcon className="h-5 w-5" /></button>
                      {nota.status === 'emitida' && (
                        <button onClick={() => cancelarNfe(nota.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><XMarkIcon className="h-5 w-5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Entrada */}
      {modalEntrada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">NF-e Entrada (Compra)</h3>
              <button onClick={() => setModalEntrada(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEntrada} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fornecedor *</label>
                  <input type="text" value={formEntrada.fornecedor} onChange={(e) => setFormEntrada({...formEntrada, fornecedor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número NF-e *</label>
                  <input type="text" value={formEntrada.numero_nfe} onChange={(e) => setFormEntrada({...formEntrada, numero_nfe: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Série</label>
                  <input type="text" value={formEntrada.serie} onChange={(e) => setFormEntrada({...formEntrada, serie: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Emissão *</label>
                  <input type="date" value={formEntrada.data_emissao} onChange={(e) => setFormEntrada({...formEntrada, data_emissao: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" required />
                </div>
              </div>

              {/* Adicionar Itens */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Itens da Nota</h4>
                <div className="flex gap-2 mb-2">
                  <select value={itemTemp.produto_id} onChange={(e) => setItemTemp({...itemTemp, produto_id: e.target.value})}
                    className="flex-1 px-3 py-2 border rounded-lg">
                    <option value="">Selecione produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.codigo_sku} - {p.nome}</option>)}
                  </select>
                  <input type="number" placeholder="Qtd" value={itemTemp.quantidade} onChange={(e) => setItemTemp({...itemTemp, quantidade: parseInt(e.target.value) || 1})}
                    className="w-20 px-3 py-2 border rounded-lg" />
                  <input type="number" step="0.01" placeholder="Preço" value={itemTemp.preco_unitario} onChange={(e) => setItemTemp({...itemTemp, preco_unitario: parseFloat(e.target.value) || ''})}
                    className="w-28 px-3 py-2 border rounded-lg" />
                  <button type="button" onClick={() => adicionarItem(formEntrada, setFormEntrada)} className="px-4 py-2 bg-green-500 text-white rounded-lg">+</button>
                </div>
                {formEntrada.itens.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Produto</th>
                        <th className="px-2 py-1 text-center">Qtd</th>
                        <th className="px-2 py-1 text-right">Preço</th>
                        <th className="px-2 py-1 text-right">Subtotal</th>
                        <th className="px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formEntrada.itens.map((item, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1">{item.produto_nome}</td>
                          <td className="px-2 py-1 text-center">{item.quantidade}</td>
                          <td className="px-2 py-1 text-right">{formatarMoeda(item.preco_unitario)}</td>
                          <td className="px-2 py-1 text-right">{formatarMoeda(item.subtotal)}</td>
                          <td className="px-2 py-1"><button type="button" onClick={() => removerItem(i, formEntrada, setFormEntrada)} className="text-red-500">×</button></td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-100">
                        <td colSpan="3" className="px-2 py-1 text-right">Total:</td>
                        <td className="px-2 py-1 text-right">{formatarMoeda(formEntrada.itens.reduce((s, i) => s + i.subtotal, 0))}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalEntrada(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg">Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Saída */}
      {modalSaida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">NF-e Saída (Venda)</h3>
              <button onClick={() => setModalSaida(false)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaida} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <select value={formSaida.cliente_id} onChange={(e) => setFormSaida({...formSaida, cliente_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} - {c.cpf_cnpj}</option>)}
                </select>
              </div>

              {/* Adicionar Itens */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Itens da Nota</h4>
                <div className="flex gap-2 mb-2">
                  <select value={itemTemp.produto_id} onChange={(e) => {
                    const p = produtos.find(x => x.id === parseInt(e.target.value));
                    setItemTemp({...itemTemp, produto_id: e.target.value, preco_unitario: p?.preco_venda || ''});
                  }} className="flex-1 px-3 py-2 border rounded-lg">
                    <option value="">Selecione produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.codigo_sku} - {p.nome}</option>)}
                  </select>
                  <input type="number" placeholder="Qtd" value={itemTemp.quantidade} onChange={(e) => setItemTemp({...itemTemp, quantidade: parseInt(e.target.value) || 1})}
                    className="w-20 px-3 py-2 border rounded-lg" />
                  <input type="number" step="0.01" placeholder="Preço" value={itemTemp.preco_unitario} onChange={(e) => setItemTemp({...itemTemp, preco_unitario: parseFloat(e.target.value) || ''})}
                    className="w-28 px-3 py-2 border rounded-lg" />
                  <button type="button" onClick={() => adicionarItem(formSaida, setFormSaida)} className="px-4 py-2 bg-blue-500 text-white rounded-lg">+</button>
                </div>
                {formSaida.itens.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Produto</th>
                        <th className="px-2 py-1 text-center">Qtd</th>
                        <th className="px-2 py-1 text-right">Preço</th>
                        <th className="px-2 py-1 text-right">Subtotal</th>
                        <th className="px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formSaida.itens.map((item, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1">{item.produto_nome}</td>
                          <td className="px-2 py-1 text-center">{item.quantidade}</td>
                          <td className="px-2 py-1 text-right">{formatarMoeda(item.preco_unitario)}</td>
                          <td className="px-2 py-1 text-right">{formatarMoeda(item.subtotal)}</td>
                          <td className="px-2 py-1"><button type="button" onClick={() => removerItem(i, formSaida, setFormSaida)} className="text-red-500">×</button></td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-100">
                        <td colSpan="3" className="px-2 py-1 text-right">Total:</td>
                        <td className="px-2 py-1 text-right">{formatarMoeda(formSaida.itens.reduce((s, i) => s + i.subtotal, 0))}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalSaida(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">Emitir NF-e</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {modalDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detalhes NF-e #{modalDetalhes.nota.numero_nfe}</h3>
              <button onClick={() => setModalDetalhes(null)}><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Tipo:</strong> {modalDetalhes.nota.tipo === 'entrada' ? 'Entrada' : 'Saída'}</div>
                <div><strong>Data:</strong> {formatarData(modalDetalhes.nota.data_emissao)}</div>
                <div><strong>Status:</strong> {modalDetalhes.nota.status}</div>
                <div><strong>Valor Total:</strong> {formatarMoeda(modalDetalhes.nota.valor_total)}</div>
                {modalDetalhes.nota.fornecedor && <div><strong>Fornecedor:</strong> {modalDetalhes.nota.fornecedor}</div>}
                {modalDetalhes.nota.cliente_nome && <div><strong>Cliente:</strong> {modalDetalhes.nota.cliente_nome}</div>}
                {modalDetalhes.nota.chave_acesso && <div className="col-span-2"><strong>Chave:</strong> <code className="text-xs">{modalDetalhes.nota.chave_acesso}</code></div>}
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Itens</h4>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Produto</th>
                      <th className="px-2 py-1 text-center">Qtd</th>
                      <th className="px-2 py-1 text-right">Preço</th>
                      <th className="px-2 py-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetalhes.itens.map((item, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1">{item.produto_nome || item.descricao}</td>
                        <td className="px-2 py-1 text-center">{item.quantidade}</td>
                        <td className="px-2 py-1 text-right">{formatarMoeda(item.preco_unitario)}</td>
                        <td className="px-2 py-1 text-right">{formatarMoeda(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setModalDetalhes(null)} className="px-4 py-2 border rounded-lg">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotasFiscais;