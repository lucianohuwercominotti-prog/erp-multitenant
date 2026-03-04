import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Admin/Sidebar';
import Header from '../components/Admin/Header';

const PainelAdmin = () => {
    const [verificando, setVerificando] = useState(true);
    const [autenticado, setAutenticado] = useState(false);

    useEffect(() => {
        // Verificar autenticação pelo localStorage
        const token = localStorage.getItem('token');
        const usuarioStr = localStorage.getItem('usuario');

        if (token && usuarioStr) {
            try {
                const usuario = JSON.parse(usuarioStr);
                // Verificar se é admin
                if (usuario.tipo === 'admin' || usuario.role === 'admin') {
                    setAutenticado(true);
                }
            } catch (error) {
                console.error('Erro ao verificar usuário:', error);
            }
        }

        setVerificando(false);
    }, []);

    // Enquanto verifica, mostra loading
    if (verificando) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando...</p>
                </div>
            </div>
        );
    }

    // Redirecionar se não estiver autenticado como admin
    if (!autenticado) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="ml-64">
                {/* Header */}
                <Header />

                {/* Content Area */}
                <main className="pt-16 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PainelAdmin;