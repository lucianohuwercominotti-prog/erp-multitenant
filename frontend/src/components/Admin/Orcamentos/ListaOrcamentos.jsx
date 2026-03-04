import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ListaOrcamentos = () => {
    const [orcamentos, setOrcamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('pendente');

    useEffect(() => {
        carregarOrcamentos();
    }, [filtroStatus]);

    const carregarOrcamentos = async () => {
        try {
            let url = '/orcamentos?';
            if (filtroStatus) url += `status=${filtroStatus}`;

            const response = await api.get(url);
            setOrcamentos(response.data.orcamentos);
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const efetivarOrcamento = async (id) => {
        const formaPagamento = prompt('Informe a forma de pagamento:\n- dinheiro\n- cartao_credito\n- cartao_debito\n- pix\n- boleto');
        
        if (!formaPagamento) return;

        try {
            await api.put(`/orcamentos/${id}/efetivar`, { forma_pagamento: formaPagamento });
            alert('Orçamento efetivado e transformado em venda com sucesso!');
            carregarOrcamentos();
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao efetivar orçamento');
        }
    };

    const cancelarOrcamento = async (id) => {
        if (!window.confirm('Tem certeza que deseja cancelar este orçamento?')) {
            return;
        }

        try {
            await api.put(`/orcamentos/${id}/cancelar`);
            alert('Orçamento cancelado com sucesso!');
            carregarOrcamentos();
        } catch (error) {
            alert('Erro ao cancelar orçamento');
        }
    };

    const excluirOrcamento = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este orçamento?')) {
            return;
        }

        try {
            await api.delete(`/orcamentos/${id}`);
            alert('Orçamento excluído com sucesso!');
            carregarOrcamentos();
        } catch (error) {
            alert('Erro ao excluir orçamento');
        }
    };

    const getBadgeStatus = (status) => {
        const badges = {
            pendente: 'bg-yellow-100 text-yellow-800',
            efetivado: 'bg-green-100 text-green-800',
            cancelado: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getBadgeOrigem = (origem) => {
        const badges = {
            site: 'bg-blue-100 text-blue-800',
            admin: 'bg-purple-100 text-purple-800'
        };
        return badges[origem] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <div className="text-center py-8">Carregando orçamentos...</div>;
    }

    return (
        <div>
            {/* Cabeçalho */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Orçamentos</h1>
                <p className="text-gray-600 mt-1">Gerencie os orçamentos solicitados</p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFiltroStatus('pendente')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filtroStatus === 'pendente'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Pendentes
                    </button>
                    <button
                        onClick={() => setFiltroStatus('efetivado')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filtroStatus === 'efetivado'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Efetivados
                    </button>
                    <button
                        onClick={() => setFiltroStatus('cancelado')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filtroStatus === 'cancelado'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Cancelados
                    </button>
                    <button
                        onClick={() => setFiltroStatus('')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filtroStatus === ''
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Todos
                    </button>
                </div>
            </div>

            {/* Lista */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orcamentos.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p className="text-xl">Nenhum orçamento {filtroStatus} encontrado</p>
                    </div>
                ) : (
                    orcamentos.map((orc) => (
                        <div key={orc.id} className="bg-white rounded-lg shadow p-6">
                            {/* Cabeçalho do Card */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{orc.numero_orcamento}</h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(orc.data_orcamento).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeStatus(orc.status)}`}>
                                        {orc.status}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeOrigem(orc.origem)}`}>
                                        {orc.origem}
                                    </span>
                                </div>
                            </div>

                            {/* Cliente */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">Cliente:</p>
                                <p className="font-semibold">{orc.cliente_nome || 'Sem cliente'}</p>
                                {orc.cliente_telefone && (
                                    <p className="text-sm text-gray-500">📱 {orc.cliente_telefone}</p>
                                )}
                            </div>

                            {/* Total */}
                            <div className="mb-4 pb-4 border-b">
                                <p className="text-2xl font-bold text-primary-600">
                                    R$ {parseFloat(orc.total).toFixed(2)}
                                </p>
                            </div>

                            {/* Ações */}
                            <div className="space-y-2">
                                {orc.status === 'pendente' && (
                                    <>
                                        <button
                                            onClick={() => efetivarOrcamento(orc.id)}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition"
                                        >
                                            ✅ Efetivar (Vender)
                                        </button>
                                        <button
                                            onClick={() => cancelarOrcamento(orc.id)}
                                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition"
                                        >
                                            ❌ Cancelar
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => excluirOrcamento(orc.id)}
                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition"
                                >
                                    🗑️ Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ListaOrcamentos;