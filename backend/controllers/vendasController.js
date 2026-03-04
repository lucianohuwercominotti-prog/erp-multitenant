const db = require('../config/database');
const { gerarNumeroVenda } = require('../utils/numeroGenerator');
const { validarCamposObrigatorios } = require('../middleware/validations');

// LISTAR VENDAS
const listarVendas = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { 
            status, 
            cliente_id, 
            data_inicio, 
            data_fim,
            pagina = 1, 
            limite = 20 
        } = req.query;

        let whereConditions = ['v.loja_id = $1'];
        let params = [loja_id];
        let paramCount = 1;

        if (status) {
            paramCount++;
            whereConditions.push(`v.status = $${paramCount}`);
            params.push(status);
        }

        if (cliente_id) {
            paramCount++;
            whereConditions.push(`v.cliente_id = $${paramCount}`);
            params.push(cliente_id);
        }

        if (data_inicio) {
            paramCount++;
            whereConditions.push(`v.data_venda >= $${paramCount}`);
            params.push(data_inicio);
        }

        if (data_fim) {
            paramCount++;
            whereConditions.push(`v.data_venda <= $${paramCount}`);
            params.push(data_fim + ' 23:59:59');
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM vendas v WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const offset = (pagina - 1) * limite;

        const result = await db.query(
            `SELECT v.*, 
                    c.nome as cliente_nome,
                    u.nome as usuario_nome
             FROM vendas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE ${whereClause}
             ORDER BY v.data_venda DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...params, limite, offset]
        );

        res.json({
            vendas: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_vendas: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        res.status(500).json({ erro: 'Erro ao listar vendas' });
    }
};

// BUSCAR VENDA POR ID
const buscarVenda = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            `SELECT v.*, 
                    c.nome as cliente_nome, c.email as cliente_email, c.telefone as cliente_telefone,
                    u.nome as usuario_nome
             FROM vendas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE v.id = $1 AND v.loja_id = $2`,
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Venda nao encontrada' });
        }

        // Buscar itens da venda
        const itens = await db.query(
            `SELECT vi.*, p.nome as produto_nome, p.codigo_sku
             FROM vendas_itens vi
             INNER JOIN produtos p ON vi.produto_id = p.id
             WHERE vi.venda_id = $1`,
            [id]
        );

        res.json({
            venda: result.rows[0],
            itens: itens.rows
        });

    } catch (error) {
        console.error('Erro ao buscar venda:', error);
        res.status(500).json({ erro: 'Erro ao buscar venda' });
    }
};

// CRIAR VENDA
const criarVenda = async (req, res) => {
    try {
        const { loja_id, id: usuario_id } = req.usuario;
        const { 
            cliente_id, 
            itens, 
            desconto, 
            forma_pagamento, 
            status, 
            observacoes 
        } = req.body;

        // Validar itens
        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'Adicione pelo menos um item a venda' });
        }

        // Validar forma de pagamento
        if (!forma_pagamento) {
            return res.status(400).json({ erro: 'Forma de pagamento e obrigatoria' });
        }

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Calcular subtotal e validar produtos
            let subtotal = 0;
            const itensValidados = [];

            for (const item of itens) {
                if (!item.produto_id || !item.quantidade || item.quantidade <= 0) {
                    throw new Error('Item invalido na venda');
                }

                // Buscar produto
                const produto = await client.query(
                    'SELECT id, nome, preco_venda, estoque_atual FROM produtos WHERE id = $1 AND loja_id = $2',
                    [item.produto_id, loja_id]
                );

                if (produto.rows.length === 0) {
                    throw new Error(`Produto ID ${item.produto_id} nao encontrado`);
                }

                const prod = produto.rows[0];

                // Usar preço informado ou preço do produto
                const precoUnitario = item.preco_unitario || prod.preco_venda;
                const itemSubtotal = precoUnitario * item.quantidade;

                subtotal += itemSubtotal;

                itensValidados.push({
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: precoUnitario,
                    subtotal: itemSubtotal,
                    estoque_atual: prod.estoque_atual
                });
            }

            // Calcular total
            const descontoValor = desconto || 0;
            const total = subtotal - descontoValor;

            if (total < 0) {
                throw new Error('Desconto nao pode ser maior que o subtotal');
            }

            // Gerar número da venda
            const numeroVenda = await gerarNumeroVenda(loja_id);

            // Inserir venda
            const vendaResult = await client.query(
                `INSERT INTO vendas (
                    loja_id, cliente_id, usuario_id, numero_venda, 
                    subtotal, desconto, total, forma_pagamento, status, observacoes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [
                    loja_id,
                    cliente_id || null,
                    usuario_id,
                    numeroVenda,
                    subtotal,
                    descontoValor,
                    total,
                    forma_pagamento,
                    status || 'pendente',
                    observacoes || null
                ]
            );

            const venda = vendaResult.rows[0];

            // Inserir itens
            for (const item of itensValidados) {
                await client.query(
                    `INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [venda.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
                );

                // Se venda já for efetivada, descontar estoque
                if (venda.status === 'efetivada') {
                    if (item.estoque_atual < item.quantidade) {
                        throw new Error(`Estoque insuficiente para produto ID ${item.produto_id}`);
                    }

                    await client.query(
                        'UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2',
                        [item.quantidade, item.produto_id]
                    );
                }
            }

            await client.query('COMMIT');

            res.status(201).json({
                mensagem: 'Venda criada com sucesso',
                venda: venda,
                itens: itensValidados.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao criar venda:', error);
        res.status(500).json({ erro: error.message || 'Erro ao criar venda' });
    }
};

// EFETIVAR VENDA
const efetivarVenda = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Buscar venda
            const vendaResult = await client.query(
                'SELECT * FROM vendas WHERE id = $1 AND loja_id = $2',
                [id, loja_id]
            );

            if (vendaResult.rows.length === 0) {
                throw new Error('Venda nao encontrada');
            }

            const venda = vendaResult.rows[0];

            if (venda.status === 'efetivada') {
                throw new Error('Venda ja esta efetivada');
            }

            if (venda.status === 'cancelada') {
                throw new Error('Venda cancelada nao pode ser efetivada');
            }

            // Buscar itens
            const itensResult = await client.query(
                'SELECT * FROM vendas_itens WHERE venda_id = $1',
                [id]
            );

            // Descontar estoque
            for (const item of itensResult.rows) {
                const produto = await client.query(
                    'SELECT estoque_atual FROM produtos WHERE id = $1',
                    [item.produto_id]
                );

                if (produto.rows[0].estoque_atual < item.quantidade) {
                    throw new Error(`Estoque insuficiente para produto ID ${item.produto_id}`);
                }

                await client.query(
                    'UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2',
                    [item.quantidade, item.produto_id]
                );
            }

            // Atualizar status da venda
            const resultado = await client.query(
                `UPDATE vendas SET status = 'efetivada', updated_at = NOW()
                 WHERE id = $1 AND loja_id = $2
                 RETURNING *`,
                [id, loja_id]
            );

            await client.query('COMMIT');

            res.json({
                mensagem: 'Venda efetivada com sucesso',
                venda: resultado.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao efetivar venda:', error);
        res.status(500).json({ erro: error.message || 'Erro ao efetivar venda' });
    }
};

// CANCELAR VENDA
const cancelarVenda = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Buscar venda
            const vendaResult = await client.query(
                'SELECT * FROM vendas WHERE id = $1 AND loja_id = $2',
                [id, loja_id]
            );

            if (vendaResult.rows.length === 0) {
                throw new Error('Venda nao encontrada');
            }

            const venda = vendaResult.rows[0];

            if (venda.status === 'cancelada') {
                throw new Error('Venda ja esta cancelada');
            }

            // Se venda estava efetivada, devolver estoque
            if (venda.status === 'efetivada') {
                const itensResult = await client.query(
                    'SELECT * FROM vendas_itens WHERE venda_id = $1',
                    [id]
                );

                for (const item of itensResult.rows) {
                    await client.query(
                        'UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2',
                        [item.quantidade, item.produto_id]
                    );
                }
            }

            // Cancelar venda
            const resultado = await client.query(
                `UPDATE vendas SET status = 'cancelada', updated_at = NOW()
                 WHERE id = $1 AND loja_id = $2
                 RETURNING *`,
                [id, loja_id]
            );

            await client.query('COMMIT');

            res.json({
                mensagem: 'Venda cancelada com sucesso',
                venda: resultado.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao cancelar venda:', error);
        res.status(500).json({ erro: error.message || 'Erro ao cancelar venda' });
    }
};

module.exports = {
    listarVendas,
    buscarVenda,
    criarVenda,
    efetivarVenda,
    cancelarVenda
};