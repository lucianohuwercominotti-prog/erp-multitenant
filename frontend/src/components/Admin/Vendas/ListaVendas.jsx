import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ListaVendas = () => {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [vendaSelecionada, setVendaSelecionada] = useState(null);
    const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

    useEffect(() => {
        carregarVendas();
    }, [filtroStatus]);

    const carregarVendas = async () => {
        try {
            let url = '/vendas?';
            if (filtroStatus) url += `status=${filtroStatus}`;

            const response = await api.get(url);
            setVendas(response.data.vendas);
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalhes = async (id) => {
        try {
            const response = await api.get(`/vendas/${id}`);
            setVendaSelecionada(response.data);
            setMostrarDetalhes(true);
        } catch (error) {
            alert('Erro ao carregar detalhes da venda');
        }
    };

    const efetivarVenda = async (id) => {
        if (!window.confirm('Tem certeza que deseja efetivar esta venda? O estoque será descontado.')) {
            return;
        }

        try {
            await api.put(`/vendas/${id}/efetivar`);
            alert('Venda efetivada com sucesso!');
            carregarVendas();
            setMostrarDetalhes(false);
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao efetivar venda');
        }
    };

    const cancelarVenda = async (id) => {
        if (!window.confirm('Tem certeza que deseja cancelar esta venda?')) {
            return;
        }

        try {
            await api.put(`/vendas/${id}/cancelar`);
            alert('Venda cancelada com sucesso!');
            carregarVendas();
            setMostrarDetalhes(false);
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao cancelar venda');
        }
    };

    const getBadgeStatus = (status) => {
        const badges = {
            pendente: 'bg-yellow-100 text-yellow-800',
            efetivada: 'bg-green-100 text-green-800',
            cancelada: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <div className="text-center py-8">Carregando vendas...</div>;
    }

    return (
        <div>
            {/* Cabeçalho */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Vendas</h1>
                <p className="text-gray-600 mt-1">Histórico de vendas realizadas</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-4">
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">Todos os Status</option>
                        <option value="pendente">Pendente</option>
                        <option value="efetivada">Efetivada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Número
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Pagamento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vendas.map((venda) => (
                            <tr key={venda.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {venda.numero_venda}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {venda.cliente_nome || 'Sem cliente'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold">
                                    R$ {parseFloat(venda.total).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {venda.forma_pagamento}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeStatus(venda.status)}`}>
                                        {venda.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        onClick={() => verDetalhes(venda.id)}
                                        className="text-primary-600 hover:text-primary-900 mr-3"
                                    >
                                        👁️ Ver
                                    </button>
                                    {venda.status === 'pendente' && (
                                        <button
                                            onClick={() => efetivarVenda(venda.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            ✅ Efetivar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalhes */}
            {mostrarDetalhes && vendaSelecionada && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">Venda {vendaSelecionada.venda.numero_venda}</h2>
                                <p className="text-gray-600">
                                    {new Date(vendaSelecionada.venda.data_venda).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <button
                                onClick={() => setMostrarDetalhes(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cliente */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Cliente</h3>
                            <p>{vendaSelecionada.venda.cliente_nome || 'Sem cliente'}</p>
                        </div>

                        {/* Itens */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Itens</h3>
                            <table className="min-w-full border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm">Produto</th>
                                        <th className="px-4 py-2 text-left text-sm">SKU</th>
                                        <th className="px-4 py-2 text-right text-sm">Qtd</th>
                                        <th className="px-4 py-2 text-right text-sm">Preço</th>
                                        <th className="px-4 py-2 text-right text-sm">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendaSelecionada.itens.map((item) => (
                                        <tr key={item.id} className="border-t">
                                            <td className="px-4 py-2">{item.produto_nome}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{item.codigo_sku}</td>
                                            <td className="px-4 py-2 text-right">{item.quantidade}</td>
                                            <td className="px-4 py-2 text-right">
                                                R$ {parseFloat(item.preco_unitario).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold">
                                                R$ {parseFloat(item.subtotal).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totais */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between mb-2">
                                <span>Subtotal:</span>
                                <span>R$ {parseFloat(vendaSelecionada.venda.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span>Desconto:</span>
                                <span>R$ {parseFloat(vendaSelecionada.venda.desconto).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold">
                                <span>TOTAL:</span>
                                <span>R$ {parseFloat(vendaSelecionada.venda.total).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="mt-6 flex gap-3">
                            {vendaSelecionada.venda.status === 'pendente' && (
                                <button
                                    onClick={() => efetivarVenda(vendaSelecionada.venda.id)}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg"
                                >
                                    ✅ Efetivar Venda
                                </button>
                            )}
                            {vendaSelecionada.venda.status !== 'cancelada' && (
                                <button
                                    onClick={() => cancelarVenda(vendaSelecionada.venda.id)}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg"
                                >
                                    ❌ Cancelar Venda
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaVendas;