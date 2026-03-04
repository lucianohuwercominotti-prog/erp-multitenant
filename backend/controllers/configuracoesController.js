const db = require('../config/database');

// OBTER CONFIGURAÇÕES DA LOJA
const obterConfiguracoes = async (req, res) => {
    try {
        const { loja_id } = req.usuario;

        const result = await db.query(
            `SELECT id, nome_exibicao, slug, telefone, whatsapp, logo,
                    cor_primaria, cor_secundaria, status, created_at, updated_at
             FROM lojas
             WHERE id = $1`,
            [loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Loja nao encontrada' });
        }

        res.json({
            configuracoes: result.rows[0],
            url_site: `/loja/${result.rows[0].slug}`
        });

    } catch (error) {
        console.error('Erro ao obter configurações:', error);
        res.status(500).json({ erro: 'Erro ao obter configuracoes' });
    }
};

// ATUALIZAR CONFIGURAÇÕES DA LOJA
const atualizarConfiguracoes = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { nome_exibicao, telefone, whatsapp, logo, cor_primaria, cor_secundaria } = req.body;

        const result = await db.query(
            `UPDATE lojas SET
                nome_exibicao = COALESCE($1, nome_exibicao),
                telefone = COALESCE($2, telefone),
                whatsapp = COALESCE($3, whatsapp),
                logo = COALESCE($4, logo),
                cor_primaria = COALESCE($5, cor_primaria),
                cor_secundaria = COALESCE($6, cor_secundaria),
                updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [nome_exibicao, telefone, whatsapp, logo, cor_primaria, cor_secundaria, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Loja nao encontrada' });
        }

        res.json({
            mensagem: 'Configuracoes atualizadas com sucesso',
            configuracoes: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ erro: 'Erro ao atualizar configuracoes' });
    }
};

// OBTER ESTATÍSTICAS GERAIS
const obterEstatisticas = async (req, res) => {
    try {
        const { loja_id } = req.usuario;

        // Vendas hoje
        const vendasHoje = await db.query(
            `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as valor
             FROM vendas
             WHERE loja_id = $1 AND status = 'efetivada' AND DATE(data_venda) = CURRENT_DATE`,
            [loja_id]
        );

        // Vendas no mês
        const vendasMes = await db.query(
            `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as valor
             FROM vendas
             WHERE loja_id = $1 AND status = 'efetivada' 
             AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)`,
            [loja_id]
        );

        // Total de produtos
        const produtos = await db.query(
            'SELECT COUNT(*) as total FROM produtos WHERE loja_id = $1',
            [loja_id]
        );

        // Total de clientes
        const clientes = await db.query(
            'SELECT COUNT(*) as total FROM clientes WHERE loja_id = $1',
            [loja_id]
        );

        // Orçamentos pendentes
        const orcamentosPendentes = await db.query(
            'SELECT COUNT(*) as total FROM orcamentos WHERE loja_id = $1 AND status = \'pendente\'',
            [loja_id]
        );

        // Contas a vencer (próximos 7 dias)
        const contasAVencer = await db.query(
            `SELECT COUNT(*) as total
             FROM contas_a_pagar
             WHERE loja_id = $1 AND status IN ('a_vencer', 'vencida')
             AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`,
            [loja_id]
        );

        // Produtos com estoque baixo
        const estoqueBaixo = await db.query(
            'SELECT COUNT(*) as total FROM produtos WHERE loja_id = $1 AND estoque_atual <= estoque_minimo',
            [loja_id]
        );

        res.json({
            vendas_hoje: {
                quantidade: parseInt(vendasHoje.rows[0].total),
                valor: parseFloat(vendasHoje.rows[0].valor)
            },
            vendas_mes: {
                quantidade: parseInt(vendasMes.rows[0].total),
                valor: parseFloat(vendasMes.rows[0].valor)
            },
            produtos_cadastrados: parseInt(produtos.rows[0].total),
            clientes_cadastrados: parseInt(clientes.rows[0].total),
            orcamentos_pendentes: parseInt(orcamentosPendentes.rows[0].total),
            contas_a_vencer_semana: parseInt(contasAVencer.rows[0].total),
            produtos_estoque_baixo: parseInt(estoqueBaixo.rows[0].total)
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ erro: 'Erro ao obter estatisticas' });
    }
};

module.exports = {
    obterConfiguracoes,
    atualizarConfiguracoes,
    obterEstatisticas
};