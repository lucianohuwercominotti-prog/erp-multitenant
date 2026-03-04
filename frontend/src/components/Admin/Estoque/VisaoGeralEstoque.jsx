import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const VisaoGeralEstoque = () => {
    const [dados, setDados] = useState({ produtos: [], estatisticas: {} });
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [mostrarAjuste, setMostrarAjuste] = useState(false);
    const [ajusteForm, setAjusteForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '' });

    useEffect(() => {
        carregarEstoque();
    }, [filtro]);

    const carregarEstoque = async () => {
        try {
            let url = '/estoque?';
            if (filtro) url += `status=${filtro}`;
            const response = await api.get(url);
            setDados(response.data);
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const registrarAjuste = async (e) => {
        e.preventDefault();
        try {
            await api.post('/estoque/ajustes', ajusteForm);
            alert('Ajuste registrado!');
            setMostrarAjuste(false);
            setAjusteForm({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '' });
            carregarEstoque();
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao registrar ajuste');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            critico: 'bg-red-100 text-red-800',
            atencao: 'bg-yellow-100 text-yellow-800',
            ok: 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100';
    };

    if (loading) return <div className="text-center py-8">Carregando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Estoque</h1>
                <button
                    onClick={() => setMostrarAjuste(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                    📦 Ajustar Estoque
                </button>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500">Total Produtos</p>
                    <p className="text-2xl font-bold">{dados.estatisticas.total_produtos || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                    <p className="text-sm text-gray-500">Críticos</p>
                    <p className="text-2xl font-bold text-red-600">{dados.estatisticas.criticos || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-500">Atenção</p>
                    <p className="text-2xl font-bold text-yellow-600">{dados.estatisticas.atencao || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-500">OK</p>
                    <p className="text-2xl font-bold text-green-600">{dados.estatisticas.ok || 0}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
                <button onClick={() => setFiltro('')} className={`px-4 py-2 rounded-lg ${filtro === '' ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>Todos</button>
                <button onClick={() => setFiltro('critico')} className={`px-4 py-2 rounded-lg ${filtro === 'critico' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Críticos</button>
                <button onClick={() => setFiltro('atencao')} className={`px-4 py-2 rounded-lg ${filtro === 'atencao' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>Atenção</button>
                <button onClick={() => setFiltro('ok')} className={`px-4 py-2 rounded-lg ${filtro === 'ok' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>OK</button>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {dados.produtos.map((prod) => (
                            <tr key={prod.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{prod.nome}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{prod.codigo_sku}</td>
                                <td className="px-6 py-4 font-bold">{prod.estoque_atual}</td>
                                <td className="px-6 py-4">{prod.estoque_minimo}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prod.status_estoque)}`}>
                                        {prod.status_estoque}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Ajuste */}
            {mostrarAjuste && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Ajuste de Estoque</h2>
                        <form onSubmit={registrarAjuste}>
                            <select
                                value={ajusteForm.produto_id}
                                onChange={(e) => setAjusteForm({...ajusteForm, produto_id: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg mb-4"
                                required
                            >
                                <option value="">Selecione o produto</option>
                                {dados.produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                            <select
                                value={ajusteForm.tipo}
                                onChange={(e) => setAjusteForm({...ajusteForm, tipo: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg mb-4"
                            >
                                <option value="entrada">Entrada</option>
                                <option value="saida">Saída</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Quantidade"
                                value={ajusteForm.quantidade}
                                onChange={(e) => setAjusteForm({...ajusteForm, quantidade: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg mb-4"
                                required
                            />
                            <textarea
                                placeholder="Motivo do ajuste"
                                value={ajusteForm.motivo}
                                onChange={(e) => setAjusteForm({...ajusteForm, motivo: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg mb-4"
                                required
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setMostrarAjuste(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisaoGeralEstoque;