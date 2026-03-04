const db = require('../config/database');
const { validarCamposObrigatorios } = require('../middleware/validations');

// LISTAR NOTAS FISCAIS
const listarNotasFiscais = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { tipo, data_inicio, data_fim, pagina = 1, limite = 20 } = req.query;

        let whereConditions = ['loja_id = $1'];
        let params = [loja_id];
        let paramCount = 1;

        if (tipo) {
            paramCount++;
            whereConditions.push(`tipo = $${paramCount}`);
            params.push(tipo);
        }

        if (data_inicio) {
            paramCount++;
            whereConditions.push(`data_emissao >= $${paramCount}`);
            params.push(data_inicio);
        }

        if (data_fim) {
            paramCount++;
            whereConditions.push(`data_emissao <= $${paramCount}`);
            params.push(data_fim);
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM notas_fiscais WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const offset = (pagina - 1) * limite;

        const result = await db.query(
            `SELECT * FROM notas_fiscais
             WHERE ${whereClause}
             ORDER BY data_emissao DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...params, limite, offset]
        );

        res.json({
            notas_fiscais: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_notas: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao listar NF-e:', error);
        res.status(500).json({ erro: 'Erro ao listar notas fiscais' });
    }
};

// BUSCAR NOTA FISCAL POR ID
const buscarNotaFiscal = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            'SELECT * FROM notas_fiscais WHERE id = $1 AND loja_id = $2',
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Nota fiscal nao encontrada' });
        }

        // Buscar itens
        const itens = await db.query(
            `SELECT ni.*, p.nome as produto_nome, p.codigo_sku
             FROM notas_fiscais_itens ni
             INNER JOIN produtos p ON ni.produto_id = p.id
             WHERE ni.nota_fiscal_id = $1`,
            [id]
        );

        res.json({
            nota_fiscal: result.rows[0],
            itens: itens.rows
        });

    } catch (error) {
        console.error('Erro ao buscar NF-e:', error);
        res.status(500).json({ erro: 'Erro ao buscar nota fiscal' });
    }
};

// REGISTRAR NF-E DE ENTRADA
const registrarNFEntrada = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { numero_nfe, serie, data_emissao, cliente_fornecedor, itens, observacoes } = req.body;

        const camposFaltando = validarCamposObrigatorios(
            ['numero_nfe', 'data_emissao', 'cliente_fornecedor', 'itens'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'Adicione pelo menos um item' });
        }

        // Verificar se NF-e já existe
        const nfeExiste = await db.query(
            'SELECT id FROM notas_fiscais WHERE numero_nfe = $1 AND serie = $2 AND loja_id = $3',
            [numero_nfe, serie || null, loja_id]
        );

        if (nfeExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'NF-e ja cadastrada com este numero e serie' });
        }

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            let valorTotal = 0;
            const itensValidados = [];

            // Validar itens
            for (const item of itens) {
                if (!item.produto_id || !item.quantidade || !item.preco_unitario) {
                    throw new Error('Item invalido na NF-e');
                }

                const produto = await client.query(
                    'SELECT id, nome FROM produtos WHERE id = $1 AND loja_id = $2',
                    [item.produto_id, loja_id]
                );

                if (produto.rows.length === 0) {
                    throw new Error(`Produto ID ${item.produto_id} nao encontrado`);
                }

                const subtotal = item.quantidade * item.preco_unitario;
                valorTotal += subtotal;

                itensValidados.push({
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: subtotal
                });
            }

            // Inserir NF-e
            const nfeResult = await client.query(
                `INSERT INTO notas_fiscais (
                    loja_id, tipo, numero_nfe, serie, data_emissao,
                    cliente_fornecedor, valor_total, observacoes
                ) VALUES ($1, 'entrada', $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [loja_id, numero_nfe, serie || null, data_emissao, cliente_fornecedor, valorTotal, observacoes || null]
            );

            const nfe = nfeResult.rows[0];

            // Inserir itens e atualizar estoque e preço de custo
            for (const item of itensValidados) {
                await client.query(
                    `INSERT INTO notas_fiscais_itens (nota_fiscal_id, produto_id, quantidade, preco_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [nfe.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
                );

                // INCREMENTAR estoque
                await client.query(
                    'UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2',
                    [item.quantidade, item.produto_id]
                );

                // Atualizar preço de custo
                await client.query(
                    'UPDATE produtos SET preco_custo = $1 WHERE id = $2',
                    [item.preco_unitario, item.produto_id]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                mensagem: 'NF-e de entrada registrada com sucesso',
                nota_fiscal: nfe,
                itens: itensValidados.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao registrar NF-e de entrada:', error);
        res.status(500).json({ erro: error.message || 'Erro ao registrar NF-e de entrada' });
    }
};

// EMITIR NF-E DE SAÍDA
const emitirNFSaida = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { numero_nfe, serie, data_emissao, cliente_id, cliente_fornecedor, itens, observacoes } = req.body;

        const camposFaltando = validarCamposObrigatorios(
            ['numero_nfe', 'data_emissao', 'itens'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'Adicione pelo menos um item' });
        }

        // Verificar se NF-e já existe
        const nfeExiste = await db.query(
            'SELECT id FROM notas_fiscais WHERE numero_nfe = $1 AND serie = $2 AND loja_id = $3',
            [numero_nfe, serie || null, loja_id]
        );

        if (nfeExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'NF-e ja cadastrada com este numero e serie' });
        }

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            let valorTotal = 0;
            const itensValidados = [];

            // Validar itens e estoque
            for (const item of itens) {
                if (!item.produto_id || !item.quantidade || !item.preco_unitario) {
                    throw new Error('Item invalido na NF-e');
                }

                const produto = await client.query(
                    'SELECT id, nome, estoque_atual FROM produtos WHERE id = $1 AND loja_id = $2',
                    [item.produto_id, loja_id]
                );

                if (produto.rows.length === 0) {
                    throw new Error(`Produto ID ${item.produto_id} nao encontrado`);
                }

                if (produto.rows[0].estoque_atual < item.quantidade) {
                    throw new Error(`Estoque insuficiente para produto ID ${item.produto_id}`);
                }

                const subtotal = item.quantidade * item.preco_unitario;
                valorTotal += subtotal;

                itensValidados.push({
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: subtotal
                });
            }

            // Buscar nome do cliente se informado
            let nomeCliente = cliente_fornecedor;
            if (cliente_id) {
                const cliente = await client.query(
                    'SELECT nome FROM clientes WHERE id = $1 AND loja_id = $2',
                    [cliente_id, loja_id]
                );
                if (cliente.rows.length > 0) {
                    nomeCliente = cliente.rows[0].nome;
                }
            }

            // Inserir NF-e
            const nfeResult = await client.query(
                `INSERT INTO notas_fiscais (
                    loja_id, tipo, numero_nfe, serie, data_emissao,
                    cliente_id, cliente_fornecedor, valor_total, observacoes
                ) VALUES ($1, 'saida', $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [loja_id, numero_nfe, serie || null, data_emissao, cliente_id || null, nomeCliente, valorTotal, observacoes || null]
            );

            const nfe = nfeResult.rows[0];

            // Inserir itens e descontar estoque
            for (const item of itensValidados) {
                await client.query(
                    `INSERT INTO notas_fiscais_itens (nota_fiscal_id, produto_id, quantidade, preco_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [nfe.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
                );

                // DESCONTAR estoque
                await client.query(
                    'UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2',
                    [item.quantidade, item.produto_id]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                mensagem: 'NF-e de saida emitida com sucesso',
                nota_fiscal: nfe,
                itens: itensValidados.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao emitir NF-e de saída:', error);
        res.status(500).json({ erro: error.message || 'Erro ao emitir NF-e de saida' });
    }
};

// EXCLUIR NF-E
const excluirNotaFiscal = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            'DELETE FROM notas_fiscais WHERE id = $1 AND loja_id = $2 RETURNING *',
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Nota fiscal nao encontrada' });
        }

        res.json({ 
            mensagem: 'Nota fiscal excluida com sucesso',
            aviso: 'O estoque NAO foi revertido. Faca ajustes manuais se necessario.'
        });

    } catch (error) {
        console.error('Erro ao excluir NF-e:', error);
        res.status(500).json({ erro: 'Erro ao excluir nota fiscal' });
    }
};

module.exports = {
    listarNotasFiscais,
    buscarNotaFiscal,
    registrarNFEntrada,
    emitirNFSaida,
    excluirNotaFiscal
};