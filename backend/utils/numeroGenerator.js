const db = require('../config/database');

/**
 * Gera número sequencial de venda
 * Formato: V{loja_id}-{AAAAMM}-{sequencial}
 * Exemplo: V1-202401-00001
 */
const gerarNumeroVenda = async (loja_id) => {
    const ano = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const anoMes = `${ano}${mes}`;

    // Buscar último número do mês
    const result = await db.query(
        `SELECT numero_venda FROM vendas 
         WHERE loja_id = $1 AND numero_venda LIKE $2
         ORDER BY id DESC LIMIT 1`,
        [loja_id, `V${loja_id}-${anoMes}-%`]
    );

    let proximoNumero = 1;

    if (result.rows.length > 0) {
        const ultimoNumero = result.rows[0].numero_venda;
        const partes = ultimoNumero.split('-');
        const sequencial = parseInt(partes[2]);
        proximoNumero = sequencial + 1;
    }

    const sequencialFormatado = String(proximoNumero).padStart(5, '0');
    return `V${loja_id}-${anoMes}-${sequencialFormatado}`;
};

/**
 * Gera número sequencial de orçamento
 * Formato: ORC{loja_id}-{AAAAMM}-{sequencial}
 * Exemplo: ORC1-202401-00001
 */
const gerarNumeroOrcamento = async (loja_id) => {
    const ano = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const anoMes = `${ano}${mes}`;

    const result = await db.query(
        `SELECT numero_orcamento FROM orcamentos 
         WHERE loja_id = $1 AND numero_orcamento LIKE $2
         ORDER BY id DESC LIMIT 1`,
        [loja_id, `ORC${loja_id}-${anoMes}-%`]
    );

    let proximoNumero = 1;

    if (result.rows.length > 0) {
        const ultimoNumero = result.rows[0].numero_orcamento;
        const partes = ultimoNumero.split('-');
        const sequencial = parseInt(partes[2]);
        proximoNumero = sequencial + 1;
    }

    const sequencialFormatado = String(proximoNumero).padStart(5, '0');
    return `ORC${loja_id}-${anoMes}-${sequencialFormatado}`;
};

module.exports = {
    gerarNumeroVenda,
    gerarNumeroOrcamento
};