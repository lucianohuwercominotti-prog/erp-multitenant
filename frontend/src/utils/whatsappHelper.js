/**
 * Formata número de telefone para WhatsApp
 * Remove caracteres especiais e adiciona código do país
 */
export const formatarNumeroWhatsApp = (numero) => {
  if (!numero) return null;
  
  // Remove todos os caracteres não numéricos
  let limpo = numero.replace(/\D/g, '');
  
  // Se tiver 10 ou 11 dígitos, adiciona código do Brasil (55)
  if (limpo.length === 10 || limpo.length === 11) {
    limpo = '55' + limpo;
  }
  
  return limpo;
};

/**
 * Formata valor monetário para exibição
 */
export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

/**
 * Gera mensagem formatada para WhatsApp
 */
export const gerarMensagemWhatsApp = (loja, cliente, itens, total) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  
  let mensagem = `Olá! Gostaria de fazer um orçamento.\n\n`;
  mensagem += `*ORÇAMENTO - ${loja.nome_exibicao || 'Loja'}*\n`;
  mensagem += `Data: ${dataAtual}\n\n`;
  mensagem += `*Itens:*\n`;
  
  itens.forEach((item, index) => {
    const subtotal = item.preco * item.quantidade;
    mensagem += `${index + 1}. ${item.quantidade}x ${item.nome}: ${formatarMoeda(subtotal)}\n`;
  });
  
  mensagem += `\n*TOTAL: ${formatarMoeda(total)}*\n\n`;
  
  if (cliente) {
    mensagem += `*Dados do cliente:*\n`;
    mensagem += `Nome: ${cliente.nome || 'Não informado'}\n`;
    if (cliente.telefone) {
      mensagem += `Telefone: ${cliente.telefone}\n`;
    }
    if (cliente.email) {
      mensagem += `E-mail: ${cliente.email}\n`;
    }
  }
  
  mensagem += `\nAguardo retorno!`;
  
  return mensagem;
};

/**
 * Gera link do WhatsApp com mensagem
 */
export const gerarLinkWhatsApp = (numeroLoja, mensagem) => {
  const numeroFormatado = formatarNumeroWhatsApp(numeroLoja);
  
  if (!numeroFormatado) {
    return null;
  }
  
  const mensagemCodificada = encodeURIComponent(mensagem);
  return `https://api.whatsapp.com/send?phone=${numeroFormatado}&text=${mensagemCodificada}`;
};

/**
 * Abre WhatsApp com orçamento
 */
export const enviarOrcamentoWhatsApp = (loja, cliente, itens, total) => {
  const mensagem = gerarMensagemWhatsApp(loja, cliente, itens, total);
  const link = gerarLinkWhatsApp(loja.whatsapp, mensagem);
  
  if (link) {
    window.open(link, '_blank');
    return true;
  }
  
  return false;
};