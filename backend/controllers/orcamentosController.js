const db = require('../config/database');
const { gerarNumeroOrcamento, gerarNumeroVenda } = require('../utils/numeroGenerator');

// LISTAR ORÇAMENTOS
const listarOrcamentos = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { status, origem, cliente_id, pagina = 1, limite = 20 } = req.query;

        let whereConditions = ['o.loja_id = $1'];
        let params = [loja_id];
        let paramCount = 1;

        if (status) {
            paramCount++;
            whereConditions.push(`o.status = $${paramCount}`);
            params.push(status);
        }

        if (origem) {
            paramCount++;
            whereConditions.push(`o.origem = $${paramCount}`);
            params.push(origem);
        }

        if (cliente_id) {
            paramCount++;
            whereConditions.push(`o.cliente_id = $${paramCount}`);
            params.push(cliente_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM orcamentos o WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const offset = (pagina - 1) * limite;

        const result = await db.query(
            `SELECT o.*, c.nome as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone
             FROM orcamentos o
             LEFT JOIN clientes c ON o.cliente_id = c.id
             WHERE ${whereClause}
             ORDER BY o.data_orcamento DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...params, limite, offset]
        );

        res.json({
            orcamentos: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_orcamentos: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao listar orcamentos:', error);
        res.status(500).json({ erro: 'Erro ao listar orcamentos' });
    }
};

// BUSCAR ORÇAMENTO POR ID
const buscarOrcamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            `SELECT o.*, c.nome as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone
             FROM orcamentos o
             LEFT JOIN clientes c ON o.cliente_id = c.id
             WHERE o.id = $1 AND o.loja_id = $2`,
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Orcamento nao encontrado' });
        }

        // Buscar itens
        const itens = await db.query(
            `SELECT oi.*, p.nome as produto_nome, p.codigo_sku
             FROM orcamentos_itens oi
             INNER JOIN produtos p ON oi.produto_id = p.id
             WHERE oi.orcamento_id = $1`,
            [id]
        );

        res.json({
            orcamento: result.rows[0],
            itens: itens.rows
        });

    } catch (error) {
        console.error('Erro ao buscar orcamento:', error);
        res.status(500).json({ erro: 'Erro ao buscar orcamento' });
    }
};

// CRIAR ORÇAMENTO
const criarOrcamento = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { cliente_id, itens, desconto, observacoes, origem } = req.body;

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'Adicione pelo menos um item' });
        }

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            let subtotal = 0;
            const itensValidados = [];

            for (const item of itens) {
                if (!item.produto_id || !item.quantidade || item.quantidade <= 0) {
                    throw new Error('Item invalido');
                }

                const produto = await client.query(
                    'SELECT id, nome, preco_venda FROM produtos WHERE id = $1 AND loja_id = $2',
                    [item.produto_id, loja_id]
                );

                if (produto.rows.length === 0) {
                    throw new Error(`Produto ID ${item.produto_id} nao encontrado`);
                }

                const prod = produto.rows[0];
                const precoUnitario = item.preco_unitario || prod.preco_venda;
                const itemSubtotal = precoUnitario * item.quantidade;

                subtotal += itemSubtotal;

                itensValidados.push({
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: precoUnitario,
                    subtotal: itemSubtotal
                });
            }

            const descontoValor = desconto || 0;
            const total = subtotal - descontoValor;

            if (total < 0) {
                throw new Error('Desconto maior que subtotal');
            }

            const numeroOrcamento = await gerarNumeroOrcamento(loja_id);

            const orcamentoResult = await client.query(
                `INSERT INTO orcamentos (
                    loja_id, cliente_id, numero_orcamento, subtotal, 
                    desconto, total, status, origem, observacoes
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pendente', $7, $8)
                RETURNING *`,
                [loja_id, cliente_id || null, numeroOrcamento, subtotal, descontoValor, total, origem || 'admin', observacoes || null]
            );

            const orcamento = orcamentoResult.rows[0];

            for (const item of itensValidados) {
                await client.query(
                    `INSERT INTO orcamentos_itens (orcamento_id, produto_id, quantidade, preco_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orcamento.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                mensagem: 'Orcamento criado com sucesso',
                orcamento: orcamento,
                itens: itensValidados.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao criar orcamento:', error);
        res.status(500).json({ erro: error.message || 'Erro ao criar orcamento' });
    }
};

// EFETIVAR ORÇAMENTO (TRANSFORMAR EM VENDA)
const efetivarOrcamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id, id: usuario_id } = req.usuario;
        const { forma_pagamento } = req.body;

        if (!forma_pagamento) {
            return res.status(400).json({ erro: 'Informe a forma de pagamento' });
        }

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Buscar orçamento
            const orcResult = await client.query(
                'SELECT * FROM orcamentos WHERE id = $1 AND loja_id = $2',
                [id, loja_id]
            );

            if (orcResult.rows.length === 0) {
                throw new Error('Orcamento nao encontrado');
            }

            const orcamento = orcResult.rows[0];

            if (orcamento.status !== 'pendente') {
                throw new Error('Orcamento nao esta pendente');
            }

            // Buscar itens do orçamento
            const itensResult = await client.query(
                'SELECT * FROM orcamentos_itens WHERE orcamento_id = $1',
                [id]
            );

            // Verificar estoque
            for (const item of itensResult.rows) {
                const produto = await client.query(
                    'SELECT estoque_atual FROM produtos WHERE id = $1',
                    [item.produto_id]
                );

                if (produto.rows[0].estoque_atual < item.quantidade) {
                    throw new Error(`Estoque insuficiente para produto ID ${item.produto_id}`);
                }
            }

            // Criar venda
            const numeroVenda = await gerarNumeroVenda(loja_id);

            const vendaResult = await client.query(
                `INSERT INTO vendas (
                    loja_id, cliente_id, usuario_id, numero_venda,
                    subtotal, desconto, total, forma_pagamento, status, observacoes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'efetivada', $9)
                RETURNING *`,
                [
                    loja_id, orcamento.cliente_id, usuario_id, numeroVenda,
                    orcamento.subtotal, orcamento.desconto, orcamento.total,
                    forma_pagamento, orcamento.observacoes
                ]
            );

            const venda = vendaResult.rows[0];

            // Copiar itens e descontar estoque
            for (const item of itensResult.rows) {
                await client.query(
                    `INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [venda.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
                );

                await client.query(
                    'UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2',
                    [item.quantidade, item.produto_id]
                );
            }

            // Atualizar status do orçamento
            await client.query(
                `UPDATE orcamentos SET status = 'efetivado', updated_at = NOW() WHERE id = $1`,
                [id]
            );

            await client.query('COMMIT');

            res.json({
                mensagem: 'Orcamento efetivado com sucesso',
                venda: venda
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao efetivar orcamento:', error);
        res.status(500).json({ erro: error.message || 'Erro ao efetivar orcamento' });
    }
};

// CANCELAR ORÇAMENTO
const cancelarOrcamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            `UPDATE orcamentos SET status = 'cancelado', updated_at = NOW()
             WHERE id = $1 AND loja_id = $2 AND status = 'pendente'
             RETURNING *`,
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Orcamento nao encontrado ou nao esta pendente' });
        }

        res.json({
            mensagem: 'Orcamento cancelado com sucesso',
            orcamento: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao cancelar orcamento:', error);
        res.status(500).json({ erro: 'Erro ao cancelar orcamento' });
    }
};

// EXCLUIR ORÇAMENTO
const excluirOrcamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            'DELETE FROM orcamentos WHERE id = $1 AND loja_id = $2 RETURNING *',
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Orcamento nao encontrado' });
        }

        res.json({ mensagem: 'Orcamento excluido com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir orcamento:', error);
        res.status(500).json({ erro: 'Erro ao excluir orcamento' });
    }
};

module.exports = {
    listarOrcamentos,
    buscarOrcamento,
    criarOrcamento,
    efetivarOrcamento,
    cancelarOrcamento,
    excluirOrcamento
};