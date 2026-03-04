const db = require('../config/database');
const { validarCamposObrigatorios } = require('../middleware/validations');

// LISTAR CONTAS A PAGAR
const listarContasAPagar = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { status, categoria, mes, ano, pagina = 1, limite = 20 } = req.query;

        let whereConditions = ['loja_id = $1'];
        let params = [loja_id];
        let paramCount = 1;

        if (status) {
            paramCount++;
            whereConditions.push(`status = $${paramCount}`);
            params.push(status);
        }

        if (categoria) {
            paramCount++;
            whereConditions.push(`categoria = $${paramCount}`);
            params.push(categoria);
        }

        if (mes && ano) {
            paramCount++;
            whereConditions.push(`EXTRACT(MONTH FROM data_vencimento) = $${paramCount}`);
            params.push(mes);
            paramCount++;
            whereConditions.push(`EXTRACT(YEAR FROM data_vencimento) = $${paramCount}`);
            params.push(ano);
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM contas_a_pagar WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const offset = (pagina - 1) * limite;

        const result = await db.query(
            `SELECT * FROM contas_a_pagar
             WHERE ${whereClause}
             ORDER BY data_vencimento ASC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...params, limite, offset]
        );

        res.json({
            contas: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_contas: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao listar contas:', error);
        res.status(500).json({ erro: 'Erro ao listar contas a pagar' });
    }
};

// CRIAR CONTA A PAGAR
const criarContaAPagar = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { descricao, valor, data_vencimento, categoria, observacoes } = req.body;

        const camposFaltando = validarCamposObrigatorios(
            ['descricao', 'valor', 'data_vencimento'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        if (valor <= 0) {
            return res.status(400).json({ erro: 'Valor deve ser maior que zero' });
        }

        // Determinar status baseado na data
        const dataVenc = new Date(data_vencimento);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let status = 'a_vencer';
        if (dataVenc < hoje) {
            status = 'vencida';
        }

        const result = await db.query(
            `INSERT INTO contas_a_pagar (
                loja_id, descricao, valor, data_vencimento, categoria, status, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [loja_id, descricao, valor, data_vencimento, categoria || null, status, observacoes || null]
        );

        res.status(201).json({
            mensagem: 'Conta criada com sucesso',
            conta: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ erro: 'Erro ao criar conta a pagar' });
    }
};

// ATUALIZAR CONTA A PAGAR
const atualizarContaAPagar = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;
        const { descricao, valor, data_vencimento, categoria, observacoes } = req.body;

        if (valor !== undefined && valor <= 0) {
            return res.status(400).json({ erro: 'Valor deve ser maior que zero' });
        }

        const result = await db.query(
            `UPDATE contas_a_pagar SET
                descricao = COALESCE($1, descricao),
                valor = COALESCE($2, valor),
                data_vencimento = COALESCE($3, data_vencimento),
                categoria = COALESCE($4, categoria),
                observacoes = COALESCE($5, observacoes),
                updated_at = NOW()
             WHERE id = $6 AND loja_id = $7
             RETURNING *`,
            [descricao, valor, data_vencimento, categoria, observacoes, id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Conta nao encontrada' });
        }

        res.json({
            mensagem: 'Conta atualizada com sucesso',
            conta: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        res.status(500).json({ erro: 'Erro ao atualizar conta' });
    }
};

// MARCAR CONTA COMO PAGA
const pagarConta = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;
        const { data_pagamento } = req.body;

        const dataPgto = data_pagamento || new Date().toISOString().split('T')[0];

        const result = await db.query(
            `UPDATE contas_a_pagar SET
                status = 'paga',
                data_pagamento = $1,
                updated_at = NOW()
             WHERE id = $2 AND loja_id = $3 AND status != 'paga'
             RETURNING *`,
            [dataPgto, id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Conta nao encontrada ou ja esta paga' });
        }

        res.json({
            mensagem: 'Conta marcada como paga',
            conta: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao pagar conta:', error);
        res.status(500).json({ erro: 'Erro ao pagar conta' });
    }
};

// EXCLUIR CONTA A PAGAR
const excluirContaAPagar = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            'DELETE FROM contas_a_pagar WHERE id = $1 AND loja_id = $2 RETURNING *',
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Conta nao encontrada' });
        }

        res.json({ mensagem: 'Conta excluida com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        res.status(500).json({ erro: 'Erro ao excluir conta' });
    }
};

// FLUXO DE CAIXA
const fluxoCaixa = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { data_inicio, data_fim } = req.query;

        const dataIni = data_inicio || new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const dataFin = data_fim || new Date().toISOString().split('T')[0];

        // ENTRADAS (vendas efetivadas)
        const entradas = await db.query(
            `SELECT 
                DATE(data_venda) as data,
                SUM(total) as total
             FROM vendas
             WHERE loja_id = $1 
             AND status = 'efetivada'
             AND DATE(data_venda) BETWEEN $2 AND $3
             GROUP BY DATE(data_venda)
             ORDER BY data`,
            [loja_id, dataIni, dataFin]
        );

        // SAÍDAS (contas pagas)
        const saidas = await db.query(
            `SELECT 
                DATE(data_pagamento) as data,
                SUM(valor) as total
             FROM contas_a_pagar
             WHERE loja_id = $1 
             AND status = 'paga'
             AND DATE(data_pagamento) BETWEEN $2 AND $3
             GROUP BY DATE(data_pagamento)
             ORDER BY data`,
            [loja_id, dataIni, dataFin]
        );

        // TOTAIS
        const totalEntradas = entradas.rows.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const totalSaidas = saidas.rows.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const saldo = totalEntradas - totalSaidas;

        // CONTAS A VENCER (próximos 30 dias)
        const contasAVencer = await db.query(
            `SELECT COUNT(*) as quantidade, SUM(valor) as total
             FROM contas_a_pagar
             WHERE loja_id = $1 
             AND status IN ('a_vencer', 'vencida')
             AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`,
            [loja_id]
        );

        res.json({
            periodo: {
                data_inicio: dataIni,
                data_fim: dataFin
            },
            resumo: {
                total_entradas: totalEntradas,
                total_saidas: totalSaidas,
                saldo: saldo
            },
            entradas: entradas.rows,
            saidas: saidas.rows,
            contas_a_vencer: {
                quantidade: parseInt(contasAVencer.rows[0].quantidade) || 0,
                total: parseFloat(contasAVencer.rows[0].total) || 0
            }
        });

    } catch (error) {
        console.error('Erro ao gerar fluxo de caixa:', error);
        res.status(500).json({ erro: 'Erro ao gerar fluxo de caixa' });
    }
};

module.exports = {
    listarContasAPagar,
    criarContaAPagar,
    atualizarContaAPagar,
    pagarConta,
    excluirContaAPagar,
    fluxoCaixa
};