const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/clientes - Listar todos os clientes da loja
router.get('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { busca } = req.query;

    let query = `SELECT id, nome, email, cpf_cnpj, telefone, cidade, estado, status, created_at FROM clientes WHERE loja_id = $1`;
    const params = [loja_id];

    if (busca && busca.trim()) {
      query += ` AND (LOWER(nome) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2) OR cpf_cnpj LIKE $2)`;
      params.push(`%${busca.trim()}%`);
    }

    query += ' ORDER BY nome';

    const resultado = await pool.query(query, params);
    res.json({ clientes: resultado.rows });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/clientes/:id - Buscar cliente específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      'SELECT * FROM clientes WHERE id = $1 AND loja_id = $2',
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json({ cliente: resultado.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;
    const { nome, telefone, endereco, cidade, estado, cep, status } = req.body;

    const resultado = await pool.query(
      `UPDATE clientes SET 
        nome = $1, 
        telefone = $2, 
        endereco = $3, 
        cidade = $4, 
        estado = $5, 
        cep = $6, 
        status = $7, 
        updated_at = NOW() 
       WHERE id = $8 AND loja_id = $9 
       RETURNING *`,
      [nome, telefone, endereco, cidade, estado, cep, status || 'ativo', id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json({ mensagem: 'Cliente atualizado com sucesso', cliente: resultado.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/clientes/:id - Desativar cliente (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      `UPDATE clientes SET status = 'inativo', updated_at = NOW() 
       WHERE id = $1 AND loja_id = $2 
       RETURNING id`,
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json({ mensagem: 'Cliente desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;