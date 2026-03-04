import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const CadastroAdmin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        cpf_cnpj: '',
        telefone: '',
        nome_loja: '',
        whatsapp: ''
    });
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        // Validar senhas
        if (formData.senha !== formData.confirmarSenha) {
            setErro('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if (formData.senha.length < 6) {
            setErro('A senha deve ter no mínimo 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const { confirmarSenha, ...dadosEnvio } = formData;

            const response = await api.post('/auth/admin/register', dadosEnvio);

            // Salvar token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify({
                ...response.data.usuario,
                loja: response.data.loja,
                tipo: 'admin'
            }));

            // Redirecionar
            navigate('/admin/dashboard');
        } catch (error) {
            setErro(error.response?.data?.erro || 'Erro ao cadastrar');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center px-4 py-8">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Cadastre sua Loja
                        </h1>
                        <p className="text-gray-600">
                            Preencha os dados abaixo para começar
                        </p>
                    </div>

                    {erro && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    E-mail *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Senha *
                                </label>
                                <input
                                    type="password"
                                    name="senha"
                                    value={formData.senha}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Confirmar Senha *
                                </label>
                                <input
                                    type="password"
                                    name="confirmarSenha"
                                    value={formData.confirmarSenha}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Nome da Loja *
                            </label>
                            <input
                                type="text"
                                name="nome_loja"
                                value={formData.nome_loja}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Ex: Minha Loja de Eletrônicos"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    CPF/CNPJ *
                                </label>
                                <input
                                    type="text"
                                    name="cpf_cnpj"
                                    value={formData.cpf_cnpj}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Telefone
                                </label>
                                <input
                                    type="text"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                WhatsApp
                            </label>
                            <input
                                type="text"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="5511999999999"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Número com código do país (ex: 5511999999999)
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar Loja'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-gray-600">
                        <p>
                            Já tem conta?{' '}
                            <Link to="/admin/login" className="text-primary-600 font-semibold hover:underline">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CadastroAdmin;