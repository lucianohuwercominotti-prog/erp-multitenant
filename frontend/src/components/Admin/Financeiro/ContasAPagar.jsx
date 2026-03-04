import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ContasAPagar = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [mostrarForm, setMostrarForm] = useState(false);
    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        data_vencimento: '',
        categoria: '',
        observacoes: ''
    });

    useEffect(() => {
        carregarContas();
    }, [filtroStatus]);

    const carregarContas = async () => {
        try {
            let url = '/financeiro/contas-a-pagar?';
            if (filtroStatus) url += `status=${filtroStatus}`;

            const response = await api.get(url);
            setContas(response.data.contas);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/financeiro/contas-a-pagar', formData);
            alert('Conta criada com sucesso!');
            setMostrarForm(false);
            setFormData({ descricao: '', valor: '', data_vencimento: '', categoria: '', observacoes: '' });
            carregarContas();
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao criar conta');
        }
    };

    const pagarConta = async (id) => {
        if (!window.confirm('Marcar esta conta como paga?')) return;

        try {
            await api.put(`/financeiro/contas-a-pagar/${id}/pagar`);
            alert('Conta marcada como paga!');
            carregarContas();
        } catch (error) {
            alert('Erro ao pagar conta');
        }
    };

    const excluirConta = async (id) => {
        if (!window.confirm('Excluir esta conta?')) return;

        try {
            await api.delete(`/financeiro/contas-a-pagar/${id}`);
            alert('Conta excluída!');
            carregarContas();
        } catch (error) {
            alert('Erro ao excluir conta');
        }
    };

    const getBadgeStatus = (status) => {
        const badges = {
            paga: 'bg-green-100 text-green-800',
            a_vencer: 'bg-blue-100 text-blue-800',
            vencida: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getRowColor = (conta) => {
        if (conta.status === 'paga') return 'bg-green-50';
        if (conta.status === 'vencida') return 'bg-red-50';
        
        const hoje = new Date();
        const vencimento = new Date(conta.data_vencimento);
        const diasParaVencer = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
        
        if (diasParaVencer <= 7 && diasParaVencer > 0) return 'bg-orange-50';
        return '';
    };

    if (loading) {
        return <div className="text-center py-8">Carregando...</div>;
    }

    return (
        <div>
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Contas a Pagar</h1>
                    <p className="text-gray-600 mt-1">Gerencie suas despesas</p>
                </div>
                <button
                    onClick={() => setMostrarForm(true)}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                    ➕ Nova Conta
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
                <button
                    onClick={() => setFiltroStatus('')}
                    className={`px-4 py-2 rounded-lg font-semibold ${filtroStatus === '' ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setFiltroStatus('a_vencer')}
                    className={`px-4 py-2 rounded-lg font-semibold ${filtroStatus === 'a_vencer' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                    A Vencer
                </button>
                <button
                    onClick={() => setFiltroStatus('vencida')}
                    className={`px-4 py-2 rounded-lg font-semibold ${filtroStatus === 'vencida' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                >
                    Vencidas
                </button>
                <button
                    onClick={() => setFiltroStatus('paga')}
                    className={`px-4 py-2 rounded-lg font-semibold ${filtroStatus === 'paga' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                    Pagas
                </button>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {contas.map((conta) => (
                            <tr key={conta.id} className={getRowColor(conta)}>
                                <td className="px-6 py-4 font-medium">{conta.descricao}</td>
                                <td className="px-6 py-4 font-bold">R$ {parseFloat(conta.valor).toFixed(2)}</td>
                                <td className="px-6 py-4">{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{conta.categoria || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeStatus(conta.status)}`}>
                                        {conta.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {conta.status !== 'paga' && (
                                        <button onClick={() => pagarConta(conta.id)} className="text-green-600 hover:text-green-900 mr-3">
                                            ✅ Pagar
                                        </button>
                                    )}
                                    <button onClick={() => excluirConta(conta.id)} className="text-red-600 hover:text-red-900">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Nova Conta */}
            {mostrarForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Nova Conta a Pagar</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Descrição *"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Valor *"
                                    value={formData.valor}
                                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                                <input
                                    type="date"
                                    value={formData.data_vencimento}
                                    onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                                <select
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="">Selecione categoria</option>
                                    <option value="aluguel">Aluguel</option>
                                    <option value="fornecedores">Fornecedores</option>
                                    <option value="impostos">Impostos</option>
                                    <option value="salarios">Salários</option>
                                    <option value="outros">Outros</option>
                                </select>
                                <textarea
                                    placeholder="Observações"
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows="2"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContasAPagar;