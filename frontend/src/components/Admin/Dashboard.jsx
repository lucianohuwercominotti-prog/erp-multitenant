import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarEstatisticas();
    }, []);

    const carregarEstatisticas = async () => {
        try {
            const response = await api.get('/configuracoes/estatisticas');
            setStats(response.data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl text-gray-600">Carregando...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Título */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-1">Visão geral do seu negócio</p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Vendas Hoje */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Vendas Hoje</p>
                            <p className="text-3xl font-bold mt-2">
                                R$ {stats?.vendas_hoje?.valor?.toFixed(2) || '0,00'}
                            </p>
                            <p className="text-blue-100 text-sm mt-1">
                                {stats?.vendas_hoje?.quantidade || 0} vendas
                            </p>
                        </div>
                        <div className="text-5xl opacity-20">💰</div>
                    </div>
                </div>

                {/* Vendas do Mês */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Vendas do Mês</p>
                            <p className="text-3xl font-bold mt-2">
                                R$ {stats?.vendas_mes?.valor?.toFixed(2) || '0,00'}
                            </p>
                            <p className="text-green-100 text-sm mt-1">
                                {stats?.vendas_mes?.quantidade || 0} vendas
                            </p>
                        </div>
                        <div className="text-5xl opacity-20">📈</div>
                    </div>
                </div>

                {/* Produtos */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Produtos</p>
                            <p className="text-3xl font-bold mt-2">
                                {stats?.produtos_cadastrados || 0}
                            </p>
                            <p className="text-purple-100 text-sm mt-1">Cadastrados</p>
                        </div>
                        <div className="text-5xl opacity-20">📦</div>
                    </div>
                </div>

                {/* Clientes */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Clientes</p>
                            <p className="text-3xl font-bold mt-2">
                                {stats?.clientes_cadastrados || 0}
                            </p>
                            <p className="text-orange-100 text-sm mt-1">Cadastrados</p>
                        </div>
                        <div className="text-5xl opacity-20">👥</div>
                    </div>
                </div>
            </div>

            {/* Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Orçamentos Pendentes */}
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Orçamentos Pendentes</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {stats?.orcamentos_pendentes || 0}
                            </p>
                        </div>
                        <div className="text-4xl">📝</div>
                    </div>
                </div>

                {/* Contas a Vencer */}
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Contas a Vencer (7 dias)</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {stats?.contas_a_vencer_semana || 0}
                            </p>
                        </div>
                        <div className="text-4xl">⚠️</div>
                    </div>
                </div>

                {/* Estoque Baixo */}
                <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Produtos - Estoque Baixo</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {stats?.produtos_estoque_baixo || 0}
                            </p>
                        </div>
                        <div className="text-4xl">🔴</div>
                    </div>
                </div>
            </div>

            {/* Mensagem de Boas-vindas */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-600 rounded-xl shadow-lg p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">
                    🎉 Bem-vindo ao seu painel de gestão!
                </h2>
                <p className="text-primary-100">
                    Aqui você pode gerenciar todos os aspectos da sua loja de forma simples e eficiente.
                    Use o menu lateral para navegar pelas funcionalidades.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;