import { jsPDF } from 'jspdf';

/**
 * Formata valor monetário
 */
const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

/**
 * Gera PDF do orçamento
 */
export const gerarPDFOrcamento = (loja, cliente, itens, total) => {
  // Criar documento PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;
  
  // ========== CABEÇALHO ==========
  
  // Nome da Loja (centralizado)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(loja.nome_exibicao || 'Loja', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  
  // Telefone da loja
  if (loja.telefone) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tel: ${loja.telefone}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
  }
  
  // WhatsApp
  if (loja.whatsapp) {
    doc.text(`WhatsApp: ${loja.whatsapp}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
  }
  
  // Linha divisória
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;
  
  // ========== TÍTULO DO ORÇAMENTO ==========
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Data e número
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
  const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const numeroOrcamento = `ORC-${Date.now()}`;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${dataFormatada} às ${horaFormatada}`, 15, yPosition);
  doc.text(`Nº: ${numeroOrcamento}`, pageWidth - 15, yPosition, { align: 'right' });
  yPosition += 10;
  
  // ========== DADOS DO CLIENTE ==========
  
  if (cliente) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 15, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (cliente.nome) {
      doc.text(`Nome: ${cliente.nome}`, 15, yPosition);
      yPosition += 5;
    }
    if (cliente.email) {
      doc.text(`E-mail: ${cliente.email}`, 15, yPosition);
      yPosition += 5;
    }
    if (cliente.telefone) {
      doc.text(`Telefone: ${cliente.telefone}`, 15, yPosition);
      yPosition += 5;
    }
    
    yPosition += 5;
  }
  
  // ========== TABELA DE ITENS ==========
  
  // Cabeçalho da tabela
  doc.setFillColor(59, 130, 246); // Azul
  doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Item', 18, yPosition + 6);
  doc.text('Produto', 35, yPosition + 6);
  doc.text('Qtd', 120, yPosition + 6);
  doc.text('Preço Unit.', 140, yPosition + 6);
  doc.text('Subtotal', 175, yPosition + 6);
  
  yPosition += 12;
  doc.setTextColor(0, 0, 0);
  
  // Itens
  doc.setFont('helvetica', 'normal');
  itens.forEach((item, index) => {
    const subtotal = item.preco * item.quantidade;
    
    // Linha zebrada
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yPosition - 4, pageWidth - 30, 8, 'F');
    }
    
    // Verificar se precisa de nova página
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(`${index + 1}`, 18, yPosition);
    
    // Truncar nome do produto se muito longo
    let nomeProduto = item.nome || 'Produto';
    if (nomeProduto.length > 40) {
      nomeProduto = nomeProduto.substring(0, 37) + '...';
    }
    doc.text(nomeProduto, 35, yPosition);
    
    doc.text(`${item.quantidade}`, 120, yPosition);
    doc.text(formatarMoeda(item.preco), 140, yPosition);
    doc.text(formatarMoeda(subtotal), 175, yPosition);
    
    yPosition += 8;
  });
  
  // Linha final da tabela
  yPosition += 2;
  doc.setLineWidth(0.3);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 8;
  
  // ========== TOTAL ==========
  
  doc.setFillColor(34, 197, 94); // Verde
  doc.rect(120, yPosition - 4, pageWidth - 135, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 125, yPosition + 3);
  doc.text(formatarMoeda(total), pageWidth - 20, yPosition + 3, { align: 'right' });
  
  yPosition += 20;
  doc.setTextColor(0, 0, 0);
  
  // ========== RODAPÉ ==========
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  
  doc.text('• Orçamento válido por 7 dias', 15, yPosition);
  yPosition += 5;
  doc.text('• Este orçamento não é um documento fiscal', 15, yPosition);
  yPosition += 5;
  
  if (loja.whatsapp) {
    doc.text(`• Entre em contato pelo WhatsApp: ${loja.whatsapp}`, 15, yPosition);
  }
  
  // Rodapé da página
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${dataFormatada} às ${horaFormatada} - ${loja.nome_exibicao || 'Loja'}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );
  
  // ========== SALVAR PDF ==========
  
  const nomeArquivo = `orcamento_${loja.slug || 'loja'}_${dataAtual.toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
  
  return nomeArquivo;
};