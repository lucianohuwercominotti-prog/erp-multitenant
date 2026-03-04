import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [formData, setFormData] = useState({ nome: '', descricao: '' });
    const [editandoId, setEditandoId] = useState(null);

    useEffect(() => {
        carregarCategorias();
    }, []);

    const carregarCategorias = async () => {
        try {
            const response = await api.get('/categorias');
            setCategorias(response.data.categorias);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await api.put(`/categorias/${editandoId}`, formData);
                alert('Categoria atualizada!');
            } else {
                await api.post('/categorias', formData);
                alert('Categoria criada!');
            }
            setMostrarForm(false);
            setFormData({ nome: '', descricao: '' });
            setEditandoId(null);
            carregarCategorias();
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao salvar');
        }
    };

    const editar = (cat) => {
        setFormData({ nome: cat.nome, descricao: cat.descricao || '' });
        setEditandoId(cat.id);
        setMostrarForm(true);
    };

    const excluir = async (id) => {
        if (!window.confirm('Excluir categoria?')) return;
        try {
            await api.delete(`/categorias/${id}`);
            alert('Excluída!');
            carregarCategorias();
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao excluir');
        }
    };

    if (loading) return <div className="text-center py-8">Carregando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Categorias</h1>
                <button
                    onClick={() => { setMostrarForm(true); setEditandoId(null); setFormData({ nome: '', descricao: '' }); }}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                    ➕ Nova Categoria
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produtos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {categorias.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{cat.nome}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{cat.descricao || '-'}</td>
                                <td className="px-6 py-4">{cat.total_produtos || 0}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => editar(cat)} className="text-primary-600 mr-3">✏️</button>
                                    <button onClick={() => excluir(cat.id)} className="text-red-600">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {mostrarForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">{editandoId ? 'Editar' : 'Nova'} Categoria</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Nome *"
                                value={formData.nome}
                                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg mb-4"
                                required
                            />
                            <textarea
                                placeholder="Descrição"
                                value={formData.descricao}
                                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg mb-4"
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categorias;