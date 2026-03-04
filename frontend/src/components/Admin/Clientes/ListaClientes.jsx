import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ListaClientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        try {
            let url = '/clientes?';
            if (busca) url += `busca=${busca}`;
            const response = await api.get(url);
            setClientes(response.data.clientes);
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = (e) => {
        e.preventDefault();
        carregarClientes();
    };

    if (loading) return <div className="text-center py-8">Carregando...</div>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
                <p className="text-gray-600">Clientes cadastrados na sua loja</p>
            </div>

            <form onSubmit={handleBuscar} className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
                <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, email ou CPF..."
                    className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button type="submit" className="bg-gray-700 text-white px-6 py-2 rounded-lg">🔍 Buscar</button>
            </form>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade/UF</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {clientes.map((cliente) => (
                            <tr key={cliente.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{cliente.nome}</td>
                                <td className="px-6 py-4 text-sm">{cliente.email}</td>
                                <td className="px-6 py-4 text-sm">{cliente.telefone}</td>
                                <td className="px-6 py-4 text-sm">{cliente.cidade}/{cliente.estado}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${cliente.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                        {cliente.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaClientes;