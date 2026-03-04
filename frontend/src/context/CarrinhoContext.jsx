import React, { createContext, useState, useEffect } from 'react';

export const CarrinhoContext = createContext();

export const CarrinhoProvider = ({ children, slugLoja }) => {
  const chaveStorage = `carrinho_${slugLoja || 'default'}`;
  
  const [itens, setItens] = useState([]);
  const [carregado, setCarregado] = useState(false);

  // Carregar carrinho do localStorage
  useEffect(() => {
    if (slugLoja) {
      const carrinhoSalvo = localStorage.getItem(chaveStorage);
      if (carrinhoSalvo) {
        try {
          setItens(JSON.parse(carrinhoSalvo));
        } catch (e) {
          console.error('Erro ao carregar carrinho:', e);
          setItens([]);
        }
      }
      setCarregado(true);
    }
  }, [slugLoja, chaveStorage]);

  // Salvar carrinho no localStorage
  useEffect(() => {
    if (carregado && slugLoja) {
      localStorage.setItem(chaveStorage, JSON.stringify(itens));
    }
  }, [itens, carregado, slugLoja, chaveStorage]);

  // Adicionar item ao carrinho
  const adicionarItem = (produto) => {
    setItens(prevItens => {
      const itemExistente = prevItens.find(item => item.produto_id === produto.produto_id);
      
      if (itemExistente) {
        // Atualiza quantidade se já existe
        const novaQuantidade = itemExistente.quantidade + produto.quantidade;
        // Respeitar limite de estoque
        const quantidadeFinal = Math.min(novaQuantidade, produto.estoque || novaQuantidade);
        
        return prevItens.map(item =>
          item.produto_id === produto.produto_id
            ? { ...item, quantidade: quantidadeFinal }
            : item
        );
      }
      
      // Adiciona novo item
      return [...prevItens, { ...produto }];
    });
  };

  // Atualizar quantidade de um item
  const atualizarQuantidade = (produtoId, quantidade) => {
    if (quantidade <= 0) {
      removerItem(produtoId);
      return;
    }

    setItens(prevItens =>
      prevItens.map(item =>
        item.produto_id === produtoId
          ? { ...item, quantidade: Math.min(quantidade, item.estoque || quantidade) }
          : item
      )
    );
  };

  // Remover item do carrinho
  const removerItem = (produtoId) => {
    setItens(prevItens => prevItens.filter(item => item.produto_id !== produtoId));
  };

  // Limpar todo o carrinho
  const limparCarrinho = () => {
    setItens([]);
  };

  // Calcular total de itens
  const totalItens = itens.reduce((total, item) => total + item.quantidade, 0);

  // Calcular valor total
  const totalValor = itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);

  // Calcular subtotal de um item
  const subtotalItem = (produtoId) => {
    const item = itens.find(i => i.produto_id === produtoId);
    return item ? item.preco * item.quantidade : 0;
  };

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        totalItens,
        totalValor,
        adicionarItem,
        atualizarQuantidade,
        removerItem,
        limparCarrinho,
        subtotalItem,
        carregado
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};