/**
 * Gera SKU único para produtos
 * Formato: LOJA{loja_id}-{timestamp}-{random}
 * Exemplo: LOJA1-1704567890-7382
 */
const gerarSKU = (loja_id) => {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `LOJA${loja_id}-${timestamp}-${random}`;
};

/**
 * Valida formato do SKU
 */
const validarSKU = (sku) => {
    const regex = /^LOJA\d+-\d+-\d+$/;
    return regex.test(sku);
};

module.exports = {
    gerarSKU,
    validarSKU
};