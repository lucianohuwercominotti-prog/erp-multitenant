import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const PDV = () => {
    const [produtos, setProdutos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState('');
    const [carrinho, setCarrinho] = useState([]);
    const [formData, setFormData] = useState({
        cliente_id: '',
        desconto: 0,
        forma_pagamento: '',
        observacoes: ''
    });

    useEffect(() => {
        carregarProdutos();
        carregarClientes();
    }, []);

    const carregarProdutos = async () => {
        try {
            const response = await api.get('/produtos?status=ativo');
            setProdutos(response.data.produtos);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const carregarClientes = async () => {
        try {
            const response = await api.get('/clientes');
            setClientes(response.data.clientes);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    const adicionarAoCarrinho = (produto) => {
        const itemExistente = carrinho.find(item => item.produto_id === produto.id);
        
        if (itemExistente) {
            setCarrinho(carrinho.map(item =>
                item.produto_id === produto.id
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
            ));
        } else {
            setCarrinho([...carrinho, {
                produto_id: produto.id,
                nome: produto.nome,
                preco_unitario: produto.preco_venda,
                quantidade: 1
            }]);
        }
    };

    const removerDoCarrinho = (produto_id) => {
        setCarrinho(carrinho.filter(item => item.produto_id !== produto_id));
    };

    const alterarQuantidade = (produto_id, quantidade) => {
        if (quantidade <= 0) {
            removerDoCarrinho(produto_id);
            return;
        }
        setCarrinho(carrinho.map(item =>
            item.produto_id === produto_id
                ? { ...item, quantidade: parseInt(quantidade) }
                : item
        ));
    };

    const calcularSubtotal = () => {
        return carrinho.reduce((total, item) => total + (item.preco_unitario * item.quantidade), 0);
    };

    const calcularTotal = () => {
        return calcularSubtotal() - (formData.desconto || 0);
    };

    const finalizarVenda = async () => {
        if (carrinho.length === 0) {
            alert('Adicione produtos ao carrinho!');
            return;
        }

        if (!formData.forma_pagamento) {
            alert('Selecione a forma de pagamento!');
            return;
        }

        try {
            const dados = {
                cliente_id: formData.cliente_id || null,
                itens: carrinho.map(item => ({
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario
                })),
                desconto: formData.desconto || 0,
                forma_pagamento: formData.forma_pagamento,
                status: 'efetivada',
                observacoes: formData.observacoes || null
            };

            const response = await api.post('/vendas', dados);
            alert(`Venda realizada com sucesso!\nNúmero: ${response.data.venda.numero_venda}`);
            
            // Limpar carrinho
            setCarrinho([]);
            setFormData({
                cliente_id: '',
                desconto: 0,
                forma_pagamento: '',
                observacoes: ''
            });
        } catch (error) {
            alert(error.response?.data?.erro || 'Erro ao realizar venda');
        }
    };

    const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo_sku.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">PDV - Ponto de Venda</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Produtos */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Produtos</h2>
                        
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar produto..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                        />

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                            {produtosFiltrados.map(produto => (
                                <div
                                    key={produto.id}
                                    onClick={() => adicionarAoCarrinho(produto)}
                                    className="border rounded-lg p-4 cursor-pointer hover:bg-primary-50 transition"
                                >
                                    <h3 className="font-semibold text-sm mb-1">{produto.nome}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{produto.codigo_sku}</p>
                                    <p className="text-lg font-bold text-primary-600">
                                        R$ {parseFloat(produto.preco_venda).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Estoque: {produto.estoque_atual}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Carrinho */}
                <div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Carrinho</h2>

                        {/* Cliente */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Cliente</label>
                            <select
                                value={formData.cliente_id}
                                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="">Sem cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Itens */}
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                            {carrinho.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">
                                    Carrinho vazio
                                </p>
                            ) : (
                                carrinho.map(item => (
                                    <div key={item.produto_id} className="border rounded p-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-semibold">{item.nome}</span>
                                            <button
                                                onClick={() => removerDoCarrinho(item.produto_id)}
                                                className="text-red-500 text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantidade}
                                                onChange={(e) => alterarQuantidade(item.produto_id, e.target.value)}
                                                className="w-16 px-2 py-1 border rounded text-sm"
                                            />
                                            <span className="text-sm font-bold">
                                                R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Totais */}
                        <div className="border-t pt-4 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm">Subtotal:</span>
                                <span className="font-semibold">R$ {calcularSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm mb-1">Desconto (R$):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.desconto}
                                    onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div className="flex justify-between text-xl font-bold text-primary-600">
                                <span>TOTAL:</span>
                                <span>R$ {calcularTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Forma de Pagamento */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">
                                Forma de Pagamento *
                            </label>
                            <select
                                value={formData.forma_pagamento}
                                onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="">Selecione...</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao_credito">Cartão de Crédito</option>
                                <option value="cartao_debito">Cartão de Débito</option>
                                <option value="pix">PIX</option>
                                <option value="boleto">Boleto</option>
                            </select>
                        </div>

                        {/* Observações */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Observações</label>
                            <textarea
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                rows="2"
                            />
                        </div>

                        {/* Botão Finalizar */}
                        <button
                            onClick={finalizarVenda}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition"
                        >
                            💰 Finalizar Venda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDV;