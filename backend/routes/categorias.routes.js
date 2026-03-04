const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/categorias - Listar categorias
router.get('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      `SELECT c.*, COUNT(p.id) as total_produtos
       FROM categorias c
       LEFT JOIN produtos p ON c.id = p.categoria_id AND p.status = 'ativo'
       WHERE c.loja_id = $1
       GROUP BY c.id
       ORDER BY c.nome`,
      [loja_id]
    );

    res.json({ categorias: resultado.rows });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/categorias/:id - Buscar categoria por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      'SELECT * FROM categorias WHERE id = $1 AND loja_id = $2',
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    res.json({ categoria: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/categorias - Criar categoria
router.post('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { nome, descricao } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const resultado = await pool.query(
      `INSERT INTO categorias (loja_id, nome, descricao, status)
       VALUES ($1, $2, $3, 'ativa') RETURNING *`,
      [loja_id, nome.trim(), descricao || '']
    );

    res.status(201).json({ mensagem: 'Categoria criada', categoria: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /api/categorias/:id - Atualizar categoria
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;
    const { nome, descricao, status } = req.body;

    const resultado = await pool.query(
      `UPDATE categorias SET nome = $1, descricao = $2, status = $3, updated_at = NOW()
       WHERE id = $4 AND loja_id = $5 RETURNING *`,
      [nome.trim(), descricao || '', status || 'ativa', id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    res.json({ mensagem: 'Categoria atualizada', categoria: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/categorias/:id - Excluir categoria
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    // Verificar se tem produtos vinculados
    const produtos = await pool.query(
      'SELECT COUNT(*) FROM produtos WHERE categoria_id = $1',
      [id]
    );

    if (parseInt(produtos.rows[0].count) > 0) {
      // Desvincular produtos da categoria
      await pool.query(
        'UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1',
        [id]
      );
    }

    const resultado = await pool.query(
      'DELETE FROM categorias WHERE id = $1 AND loja_id = $2 RETURNING id',
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Categoria não encontrada' });
    }

    res.json({ mensagem: 'Categoria excluída' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
