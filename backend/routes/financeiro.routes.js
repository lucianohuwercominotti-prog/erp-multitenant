const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ========== CONTAS A PAGAR ==========

router.get('/contas-a-pagar', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { status, categoria } = req.query;

    let query = `SELECT * FROM contas_a_pagar WHERE loja_id = $1`;
    const params = [loja_id];
    let idx = 2;

    if (status && status !== 'todas') {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }
    if (categoria) {
      query += ` AND categoria = $${idx++}`;
      params.push(categoria);
    }

    query += ' ORDER BY data_vencimento ASC';
    const resultado = await pool.query(query, params);

    const totais = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'a_vencer' THEN valor ELSE 0 END), 0) as total_a_vencer,
        COALESCE(SUM(CASE WHEN status = 'vencida' THEN valor ELSE 0 END), 0) as total_vencidas,
        COALESCE(SUM(CASE WHEN status = 'paga' THEN valor ELSE 0 END), 0) as total_pagas
      FROM contas_a_pagar WHERE loja_id = $1
    `, [loja_id]);

    res.json({ contas: resultado.rows, totais: totais.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/contas-a-pagar', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { descricao, valor, data_vencimento, categoria, observacoes } = req.body;

    const hoje = new Date();
    const vencimento = new Date(data_vencimento);
    const status = vencimento < hoje ? 'vencida' : 'a_vencer';

    const resultado = await pool.query(
      `INSERT INTO contas_a_pagar (loja_id, descricao, valor, data_vencimento, categoria, status, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [loja_id, descricao, valor, data_vencimento, categoria || 'outros', status, observacoes || '']
    );

    res.status(201).json({ mensagem: 'Conta criada', conta: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/contas-a-pagar/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;
    const { descricao, valor, data_vencimento, categoria, observacoes } = req.body;

    const resultado = await pool.query(
      `UPDATE contas_a_pagar SET descricao=$1, valor=$2, data_vencimento=$3, categoria=$4, observacoes=$5, updated_at=NOW()
       WHERE id=$6 AND loja_id=$7 RETURNING *`,
      [descricao, valor, data_vencimento, categoria, observacoes, id, loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ mensagem: 'Atualizada', conta: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/contas-a-pagar/:id/pagar', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      `UPDATE contas_a_pagar SET status='paga', data_pagamento=NOW(), updated_at=NOW()
       WHERE id=$1 AND loja_id=$2 RETURNING *`,
      [id, loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ mensagem: 'Paga', conta: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/contas-a-pagar/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      'DELETE FROM contas_a_pagar WHERE id=$1 AND loja_id=$2 RETURNING id',
      [id, loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ mensagem: 'Excluída' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ========== CONTAS A RECEBER ==========

router.get('/contas-a-receber', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { status } = req.query;

    let query = `
      SELECT cr.*, c.nome as cliente_nome
      FROM contas_a_receber cr
      LEFT JOIN clientes c ON cr.cliente_id = c.id
      WHERE cr.loja_id = $1
    `;
    const params = [loja_id];

    if (status && status !== 'todas') {
      query += ` AND cr.status = $2`;
      params.push(status);
    }

    query += ' ORDER BY cr.data_vencimento ASC';
    const resultado = await pool.query(query, params);

    const totais = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'a_receber' THEN valor ELSE 0 END), 0) as total_a_receber,
        COALESCE(SUM(CASE WHEN status = 'vencida' THEN valor ELSE 0 END), 0) as total_vencidas,
        COALESCE(SUM(CASE WHEN status = 'recebida' THEN valor ELSE 0 END), 0) as total_recebidas
      FROM contas_a_receber WHERE loja_id = $1
    `, [loja_id]);

    res.json({ contas: resultado.rows, totais: totais.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/contas-a-receber', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { cliente_id, venda_id, descricao, valor, data_vencimento, categoria, observacoes } = req.body;

    const hoje = new Date();
    const vencimento = new Date(data_vencimento);
    const status = vencimento < hoje ? 'vencida' : 'a_receber';

    const resultado = await pool.query(
      `INSERT INTO contas_a_receber (loja_id, cliente_id, venda_id, descricao, valor, data_vencimento, categoria, status, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [loja_id, cliente_id || null, venda_id || null, descricao, valor, data_vencimento, categoria || 'vendas', status, observacoes || '']
    );

    res.status(201).json({ mensagem: 'Conta criada', conta: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/contas-a-receber/:id/receber', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      `UPDATE contas_a_receber SET status='recebida', data_recebimento=NOW(), updated_at=NOW()
       WHERE id=$1 AND loja_id=$2 RETURNING *`,
      [id, loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ mensagem: 'Recebida', conta: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/contas-a-receber/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      'DELETE FROM contas_a_receber WHERE id=$1 AND loja_id=$2 RETURNING id',
      [id, loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ mensagem: 'Excluída' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ========== FLUXO DE CAIXA ==========

router.get('/fluxo-caixa', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { periodo = '30' } = req.query;

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));

    const entradas = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM vendas WHERE loja_id = $1 AND status = 'efetivada' AND data_venda >= $2
    `, [loja_id, dataInicio]);

    const saidas = await pool.query(`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM contas_a_pagar WHERE loja_id = $1 AND status = 'paga' AND data_pagamento >= $2
    `, [loja_id, dataInicio]);

    const movimentacoes = await pool.query(`
      SELECT DATE(data_venda) as data, 'entrada' as tipo, SUM(total) as valor
      FROM vendas WHERE loja_id = $1 AND status = 'efetivada' AND data_venda >= $2
      GROUP BY DATE(data_venda)
      UNION ALL
      SELECT DATE(data_pagamento) as data, 'saida' as tipo, SUM(valor) as valor
      FROM contas_a_pagar WHERE loja_id = $1 AND status = 'paga' AND data_pagamento >= $2
      GROUP BY DATE(data_pagamento)
      ORDER BY data DESC
    `, [loja_id, dataInicio]);

    const totalEntradas = parseFloat(entradas.rows[0].total);
    const totalSaidas = parseFloat(saidas.rows[0].total);

    res.json({
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
      movimentacoes: movimentacoes.rows
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
