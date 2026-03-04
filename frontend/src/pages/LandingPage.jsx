import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">ERP Multi-Tenant</h1>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center text-white mb-16">
                    <h2 className="text-5xl md:text-6xl font-bold mb-6">
                        Sistema ERP para sua Loja
                    </h2>
                    <p className="text-xl md:text-2xl mb-8 text-primary-100">
                        Gerencie produtos, vendas, estoque e muito mais em um só lugar
                    </p>
                </div>

                {/* Cards de Acesso */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    
                    {/* Card Cliente */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition duration-300">
                        <div className="text-center">
                            <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                Sou Cliente
                            </h3>
                            
                            <p className="text-gray-600 mb-6">
                                Acesse o catálogo da sua loja favorita e faça orçamentos
                            </p>
                            
                            <button
                                onClick={() => navigate('/buscar-loja')}
                                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                            >
                                Buscar Loja
                            </button>
                        </div>
                    </div>

                    {/* Card Administrador */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition duration-300">
                        <div className="text-center">
                            <div className="bg-secondary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                Sou Administrador
                            </h3>
                            
                            <p className="text-gray-600 mb-6">
                                Gerencie sua loja de forma completa e profissional
                            </p>
                            
                            <button
                                onClick={() => navigate('/admin/login')}
                                className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                            >
                                Acessar Painel Admin
                            </button>
                        </div>
                    </div>

                </div>

                {/* Link para Cadastro */}
                <div className="text-center mt-12">
                    <p className="text-white text-lg">
                        Não tem uma conta?{' '}
                        <button
                            onClick={() => navigate('/admin/cadastro')}
                            className="font-bold underline hover:text-primary-100 transition"
                        >
                            Cadastre sua loja gratuitamente
                        </button>
                    </p>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-3 gap-8 text-white">
                    <div className="text-center">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-xl font-bold mb-2">Gestão de Produtos</h3>
                        <p className="text-primary-100">Cadastre, organize e controle seu estoque</p>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-xl font-bold mb-2">Controle Financeiro</h3>
                        <p className="text-primary-100">Acompanhe vendas, despesas e fluxo de caixa</p>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-4xl mb-4">🌐</div>
                        <h3 className="text-xl font-bold mb-2">Site Próprio</h3>
                        <p className="text-primary-100">Cada loja tem seu catálogo online exclusivo</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-white border-t border-primary-400">
                <p>&copy; 2024 ERP Multi-Tenant. Sistema de gestão completo para lojas.</p>
            </footer>
        </div>
    );
};

export default LandingPage;