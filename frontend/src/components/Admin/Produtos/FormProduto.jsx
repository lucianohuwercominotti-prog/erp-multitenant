import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';

const FormProduto = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        categoria_id: '',
        descricao: '',
        preco_venda: '',
        preco_custo: '',
        estoque_inicial: 0,
        estoque_minimo: 0,
        imagem: '',
        status: 'ativo'
    });

    useEffect(() => {
        carregarCategorias();
        if (id) {
            carregarProduto();
        }
    }, [id]);

    const carregarCategorias = async () => {
        try {
            const response = await api.get('/categorias');
            setCategorias(response.data.categorias);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const carregarProduto = async () => {
        try {
            const response = await api.get(`/produtos/${id}`);
            const produto = response.data;
            setFormData({
                nome: produto.nome,
                categoria_id: produto.categoria_id || '',
                descricao: produto.descricao || '',
                preco_venda: produto.preco_venda,
                preco_custo: produto.preco_custo || '',
                estoque_inicial: produto.estoque_atual,
                estoque_minimo: produto.estoque_minimo,
                imagem: produto.imagem || '',
                status: produto.status
            });
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            alert('Erro ao carregar produto');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                // Atualizar
                await api.put(`/produtos/${id}`, formData);
                alert('Produto atualizado com sucesso!');
            } else {
                // Criar
                await api.post('/produtos', formData);
                alert('Produto cadastrado com sucesso!');
            }
            navigate('/admin/produtos');
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Cabeçalho */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/produtos')}
                    className="text-gray-600 hover:text-gray-800 mb-4"
                >
                    ← Voltar para produtos
                </button>
                <h1 className="text-3xl font-bold text-gray-800">
                    {id ? 'Editar Produto' : 'Novo Produto'}
                </h1>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome */}
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Nome do Produto *
                            </label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Categoria
                            </label>
                            <select
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Sem categoria</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>

                        {/* Descrição */}
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-2">
                                Descrição
                            </label>
                            <textarea
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Preço de Venda */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Preço de Venda (R$) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="preco_venda"
                                value={formData.preco_venda}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        {/* Preço de Custo */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Preço de Custo (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="preco_custo"
                                value={formData.preco_custo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Estoque Inicial */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Estoque Inicial
                            </label>
                            <input
                                type="number"
                                name="estoque_inicial"
                                value={formData.estoque_inicial}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Estoque Mínimo */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Estoque Mínimo
                            </label>
                            <input
                                type="number"
                                name="estoque_minimo"
                                value={formData.estoque_minimo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* URL da Imagem */}
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-2">
                                URL da Imagem
                            </label>
                            <input
                                type="text"
                                name="imagem"
                                value={formData.imagem}
                                onChange={handleChange}
                                placeholder="https://exemplo.com/imagem.jpg"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/produtos')}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormProduto;