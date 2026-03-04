import React, { useContext, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCartIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CarrinhoContext } from '../../context/CarrinhoContext';
import { AuthContext } from '../../context/AuthContext';
import { gerarPDFOrcamento } from '../../utils/pdfGenerator';
import { enviarOrcamentoWhatsApp } from '../../utils/whatsappHelper';
import { criarOrcamentoCliente } from '../../services/api';
import toast from 'react-hot-toast';

const Carrinho = ({ loja }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { 
    itens, 
    totalValor, 
    atualizarQuantidade, 
    removerItem, 
    limparCarrinho 
  } = useContext(CarrinhoContext);
  const { usuario } = useContext(AuthContext);
  
  const [salvando, setSalvando] = useState(false);
  
  const corPrimaria = loja?.cor_primaria || '#3B82F6';

  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Verificar se cliente está logado
  const clienteLogado = usuario && usuario.tipo === 'cliente';

  // Redirecionar para login se não estiver logado
  const verificarLogin = (acao) => {
    if (!clienteLogado) {
      toast.error('Faça login para continuar');
      navigate(`/loja/${slug}/login`, { 
        state: { 
          from: `/loja/${slug}/carrinho`,
          mensagem: 'Faça login para gerar seu orçamento'
        }
      });
      return false;
    }
    return true;
  };

  // Salvar orçamento no banco de dados
  const salvarOrcamento = async () => {
    try {
      const dadosOrcamento = {
        loja_id: loja.id,
        cliente_id: usuario.id,
        itens: itens.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        })),
        total: totalValor,
        origem: 'site'
      };

      await criarOrcamentoCliente(dadosOrcamento);
      return true;
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      return false;
    }
  };

  // Gerar PDF
  const handleGerarPDF = async () => {
    if (!verificarLogin()) return;

    try {
      setSalvando(true);
      
      // Salvar orçamento no banco
      const salvou = await salvarOrcamento();
      
      // Gerar PDF
      gerarPDFOrcamento(loja, usuario, itens, totalValor);
      
      if (salvou) {
        toast.success('PDF gerado e orçamento salvo!');
      } else {
        toast.success('PDF gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setSalvando(false);
    }
  };

  // Enviar por WhatsApp
  const handleEnviarWhatsApp = async () => {
    if (!verificarLogin()) return;

    if (!loja.whatsapp) {
      toast.error('Esta loja não tem WhatsApp configurado');
      return;
    }

    try {
      setSalvando(true);
      
      // Salvar orçamento no banco
      await salvarOrcamento();
      
      // Enviar WhatsApp
      const enviou = enviarOrcamentoWhatsApp(loja, usuario, itens, totalValor);
      
      if (enviou) {
        toast.success('Redirecionando para WhatsApp...');
      } else {
        toast.error('Erro ao abrir WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast.error('Erro ao enviar WhatsApp');
    } finally {
      setSalvando(false);
    }
  };

  // Limpar carrinho
  const handleLimparCarrinho = () => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      limparCarrinho();
      toast.success('Carrinho limpo!');
    }
  };

  // Carrinho vazio
  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCartIcon className="h-20 w-20 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-500 mb-8">
              Adicione produtos para montar seu orçamento
            </p>
            <Link
              to={`/loja/${slug}/produtos`}
              className="inline-flex items-center px-6 py-3 text-white rounded-lg font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: corPrimaria }}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Ver Produtos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Meu Orçamento</h1>
          <p className="text-gray-500">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'} no carrinho
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header da tabela */}
              <div className="bg-gray-50 px-6 py-3 border-b hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500">
                <div className="col-span-6">Produto</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-2 text-right">Preço</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {/* Itens */}
              <div className="divide-y">
                {itens.map((item) => (
                  <div key={item.produto_id} className="p-4 md:p-6">
                    <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
                      {/* Produto */}
                      <div className="col-span-6 flex items-center space-x-4 mb-4 md:mb-0">
                        {/* Imagem */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.imagem ? (
                            <img
                              src={item.imagem}
                              alt={item.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCartIcon className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        {/* Nome e remover */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">
                            {item.nome}
                          </h3>
                          <button
                            onClick={() => removerItem(item.produto_id)}
                            className="text-sm text-red-500 hover:text-red-700 flex items-center mt-1"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Remover
                          </button>
                        </div>
                      </div>

                      {/* Quantidade */}
                      <div className="col-span-2 flex items-center justify-center mb-4 md:mb-0">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)}
                            className="p-2 hover:bg-gray-100 rounded-l-lg"
                            disabled={item.quantidade <= 1}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)}
                            className="p-2 hover:bg-gray-100 rounded-r-lg"
                            disabled={item.quantidade >= (item.estoque || 99)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Preço unitário */}
                      <div className="col-span-2 text-right mb-2 md:mb-0">
                        <span className="md:hidden text-gray-500 text-sm">Preço: </span>
                        <span className="font-medium">{formatarPreco(item.preco)}</span>
                      </div>

                      {/* Subtotal */}
                      <div className="col-span-2 text-right">
                        <span className="md:hidden text-gray-500 text-sm">Subtotal: </span>
                        <span className="font-bold" style={{ color: corPrimaria }}>
                          {formatarPreco(item.preco * item.quantidade)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleLimparCarrinho}
                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Limpar Carrinho
                  </button>
                  <Link
                    to={`/loja/${slug}/produtos`}
                    className="text-sm font-medium flex items-center hover:underline"
                    style={{ color: corPrimaria }}
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Continuar Comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo e Ações */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="font-bold text-lg text-gray-800 mb-4">
                Resumo do Orçamento
              </h3>

              {/* Total de itens */}
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Itens:</span>
                <span>{itens.reduce((acc, item) => acc + item.quantidade, 0)}</span>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-gray-600 mb-4">
                <span>Subtotal:</span>
                <span>{formatarPreco(totalValor)}</span>
              </div>

              {/* Linha divisória */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span 
                  className="text-2xl font-bold"
                  style={{ color: corPrimaria }}
                >
                  {formatarPreco(totalValor)}
                </span>
              </div>

              {/* Aviso de login */}
              {!clienteLogado && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-700">
                    <strong>Atenção:</strong> Faça login para gerar seu orçamento
                  </p>
                  <Link
                    to={`/loja/${slug}/login`}
                    state={{ from: `/loja/${slug}/carrinho` }}
                    className="text-sm font-medium text-yellow-800 hover:underline"
                  >
                    Clique aqui para entrar
                  </Link>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-3">
                {/* Gerar PDF */}
                <button
                  onClick={handleGerarPDF}
                  disabled={salvando}
                  className="w-full py-3 text-white rounded-lg font-semibold flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: corPrimaria }}
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {salvando ? 'Gerando...' : 'Gerar PDF do Orçamento'}
                </button>

                {/* Enviar WhatsApp */}
                <button
                  onClick={handleEnviarWhatsApp}
                  disabled={salvando || !loja.whatsapp}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {salvando ? 'Enviando...' : 'Enviar por WhatsApp'}
                </button>

                {/* Aviso se não tem WhatsApp */}
                {!loja.whatsapp && (
                  <p className="text-xs text-gray-500 text-center">
                    WhatsApp não configurado para esta loja
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrinho;