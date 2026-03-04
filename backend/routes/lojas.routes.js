const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/lojas/buscar?nome=termo - Buscar lojas por nome (público)
router.get('/buscar', async (req, res) => {
  try {
    const { nome } = req.query;
    
    if (!nome || nome.trim().length < 2) {
      return res.status(400).json({ erro: 'Digite pelo menos 2 caracteres para buscar' });
    }

    const resultado = await pool.query(
      `SELECT id, nome_exibicao, slug, logo 
       FROM lojas 
       WHERE status = 'ativa' 
         AND (LOWER(nome_exibicao) LIKE LOWER($1) OR LOWER(slug) LIKE LOWER($1))
       ORDER BY nome_exibicao
       LIMIT 10`,
      [`%${nome.trim()}%`]
    );

    res.json({ lojas: resultado.rows });
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// GET /api/lojas/:slug - Buscar loja por slug (público)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const resultado = await pool.query(
      `SELECT id, nome_exibicao, slug, telefone, whatsapp, logo, 
              cor_primaria, cor_secundaria, status
       FROM lojas 
       WHERE slug = $1`,
      [slug]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    res.json({ loja: resultado.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
