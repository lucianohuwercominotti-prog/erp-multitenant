const db = require('../config/database');
const { validarCamposObrigatorios } = require('../middleware/validations');

// LISTAR CATEGORIAS
const listarCategorias = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { status } = req.query;

        let query = `
            SELECT c.*, 
                   COUNT(p.id) as total_produtos
            FROM categorias c
            LEFT JOIN produtos p ON c.id = p.categoria_id
            WHERE c.loja_id = $1
        `;
        const params = [loja_id];

        if (status) {
            query += ` AND c.status = $2`;
            params.push(status);
        }

        query += ` GROUP BY c.id ORDER BY c.nome`;

        const result = await db.query(query, params);

        res.json({
            categorias: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ erro: 'Erro ao listar categorias' });
    }
};

// CRIAR CATEGORIA
const criarCategoria = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { nome, descricao, status } = req.body;

        const camposFaltando = validarCamposObrigatorios(['nome'], req.body);
        if (camposFaltando.length > 0) {
            return res.status(400).json({ erro: 'Campo nome e obrigatorio' });
        }

        const result = await db.query(
            `INSERT INTO categorias (loja_id, nome, descricao, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [loja_id, nome.trim(), descricao || null, status || 'ativa']
        );

        res.status(201).json({
            mensagem: 'Categoria criada com sucesso',
            categoria: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ erro: 'Erro ao criar categoria' });
    }
};

// ATUALIZAR CATEGORIA
const atualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;
        const { nome, descricao, status } = req.body;

        const result = await db.query(
            `UPDATE categorias SET
                nome = COALESCE($1, nome),
                descricao = COALESCE($2, descricao),
                status = COALESCE($3, status),
                updated_at = NOW()
             WHERE id = $4 AND loja_id = $5
             RETURNING *`,
            [nome, descricao, status, id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Categoria nao encontrada' });
        }

        res.json({
            mensagem: 'Categoria atualizada com sucesso',
            categoria: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ erro: 'Erro ao atualizar categoria' });
    }
};

// EXCLUIR CATEGORIA
const excluirCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const produtosVinculados = await db.query(
            'SELECT COUNT(*) as total FROM produtos WHERE categoria_id = $1',
            [id]
        );

        if (parseInt(produtosVinculados.rows[0].total) > 0) {
            return res.status(400).json({
                erro: 'Categoria possui produtos vinculados',
                total_produtos: produtosVinculados.rows[0].total
            });
        }

        const result = await db.query(
            'DELETE FROM categorias WHERE id = $1 AND loja_id = $2 RETURNING *',
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Categoria nao encontrada' });
        }

        res.json({ mensagem: 'Categoria excluida com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        res.status(500).json({ erro: 'Erro ao excluir categoria' });
    }
};

module.exports = {
    listarCategorias,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria
};