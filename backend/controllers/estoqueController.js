const db = require('../config/database');
const { validarCamposObrigatorios } = require('../middleware/validations');

// VISÃO GERAL DO ESTOQUE
const visaoGeralEstoque = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { status } = req.query;

        let query = `
            SELECT p.id, p.nome, p.codigo_sku, p.estoque_atual, p.estoque_minimo,
                   c.nome as categoria_nome,
                   CASE 
                       WHEN p.estoque_atual < p.estoque_minimo THEN 'critico'
                       WHEN p.estoque_atual = p.estoque_minimo THEN 'atencao'
                       ELSE 'ok'
                   END as status_estoque
            FROM produtos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.loja_id = $1
        `;

        const params = [loja_id];

        if (status === 'critico') {
            query += ' AND p.estoque_atual < p.estoque_minimo';
        } else if (status === 'atencao') {
            query += ' AND p.estoque_atual = p.estoque_minimo';
        } else if (status === 'ok') {
            query += ' AND p.estoque_atual > p.estoque_minimo';
        }

        query += ' ORDER BY p.nome';

        const result = await db.query(query, params);

        // Estatísticas
        const stats = await db.query(
            `SELECT 
                COUNT(*) as total_produtos,
                COUNT(CASE WHEN estoque_atual < estoque_minimo THEN 1 END) as criticos,
                COUNT(CASE WHEN estoque_atual = estoque_minimo THEN 1 END) as atencao,
                COUNT(CASE WHEN estoque_atual > estoque_minimo THEN 1 END) as ok
             FROM produtos
             WHERE loja_id = $1`,
            [loja_id]
        );

        res.json({
            produtos: result.rows,
            estatisticas: stats.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        res.status(500).json({ erro: 'Erro ao buscar estoque' });
    }
};

// HISTÓRICO DE AJUSTES
const historicoAjustes = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { produto_id, tipo, pagina = 1, limite = 20 } = req.query;

        let whereConditions = ['a.loja_id = $1'];
        let params = [loja_id];
        let paramCount = 1;

        if (produto_id) {
            paramCount++;
            whereConditions.push(`a.produto_id = $${paramCount}`);
            params.push(produto_id);
        }

        if (tipo) {
            paramCount++;
            whereConditions.push(`a.tipo = $${paramCount}`);
            params.push(tipo);
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM ajustes_estoque a WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const offset = (pagina - 1) * limite;

        const result = await db.query(
            `SELECT a.*, 
                    p.nome as produto_nome, 
                    p.codigo_sku,
                    u.nome as usuario_nome
             FROM ajustes_estoque a
             INNER JOIN produtos p ON a.produto_id = p.id
             LEFT JOIN usuarios u ON a.usuario_id = u.id
             WHERE ${whereClause}
             ORDER BY a.data_ajuste DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...params, limite, offset]
        );

        res.json({
            ajustes: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_ajustes: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ erro: 'Erro ao buscar historico de ajustes' });
    }
};

// REGISTRAR AJUSTE DE ESTOQUE
const registrarAjuste = async (req, res) => {
    try {
        const { loja_id, id: usuario_id } = req.usuario;
        const { produto_id, tipo, quantidade, motivo } = req.body;

        const camposFaltando = validarCamposObrigatorios(
            ['produto_id', 'tipo', 'quantidade', 'motivo'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        if (tipo !== 'entrada' && tipo !== 'saida') {
            return res.status(400).json({ erro: 'Tipo deve ser entrada ou saida' });
        }

        if (quantidade <= 0) {
            return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
        }

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Buscar produto e estoque atual
            const produto = await client.query(
                'SELECT id, nome, estoque_atual FROM produtos WHERE id = $1 AND loja_id = $2',
                [produto_id, loja_id]
            );

            if (produto.rows.length === 0) {
                throw new Error('Produto nao encontrado');
            }

            const estoqueAnterior = produto.rows[0].estoque_atual;
            let estoqueNovo;

            if (tipo === 'entrada') {
                estoqueNovo = estoqueAnterior + quantidade;
            } else {
                estoqueNovo = estoqueAnterior - quantidade;
                if (estoqueNovo < 0) {
                    throw new Error('Estoque nao pode ficar negativo');
                }
            }

            // Atualizar estoque do produto
            await client.query(
                'UPDATE produtos SET estoque_atual = $1 WHERE id = $2',
                [estoqueNovo, produto_id]
            );

            // Registrar ajuste
            const ajusteResult = await client.query(
                `INSERT INTO ajustes_estoque (
                    loja_id, produto_id, usuario_id, tipo, quantidade,
                    motivo, estoque_anterior, estoque_novo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [loja_id, produto_id, usuario_id, tipo, quantidade, motivo, estoqueAnterior, estoqueNovo]
            );

            await client.query('COMMIT');

            res.status(201).json({
                mensagem: 'Ajuste de estoque registrado com sucesso',
                ajuste: ajusteResult.rows[0],
                produto: produto.rows[0].nome,
                estoque_anterior: estoqueAnterior,
                estoque_novo: estoqueNovo
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao registrar ajuste:', error);
        res.status(500).json({ erro: error.message || 'Erro ao registrar ajuste' });
    }
};

module.exports = {
    visaoGeralEstoque,
    historicoAjustes,
    registrarAjuste
};