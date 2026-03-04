import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const abrirSite = () => {
        if (usuario?.loja?.slug) {
            window.open(`/loja/${usuario.loja.slug}`, '_blank');
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Loja */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {usuario?.loja?.nome_exibicao || 'Minha Loja'}
                    </h2>
                </div>

                {/* Ações */}
                <div className="flex items-center space-x-4">
                    {/* Ver Site */}
                    {usuario?.loja?.slug && (
                        <button
                            onClick={abrirSite}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                        >
                            🌐 Ver Meu Site
                        </button>
                    )}

                    {/* Usuário */}
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">
                                {usuario?.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                                {usuario?.email}
                            </p>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;