const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Estatísticas do Dashboard
router.get('/estatisticas', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;

    const vendasHoje = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total FROM vendas 
       WHERE loja_id = $1 AND status = 'efetivada' 
       AND DATE(data_venda) = CURRENT_DATE`,
      [loja_id]
    );

    const vendasMes = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total FROM vendas 
       WHERE loja_id = $1 AND status = 'efetivada' 
       AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [loja_id]
    );

    const totalProdutos = await pool.query(
      `SELECT COUNT(*) as total FROM produtos WHERE loja_id = $1 AND status = 'ativo'`,
      [loja_id]
    );

    const totalClientes = await pool.query(
      `SELECT COUNT(*) as total FROM clientes WHERE loja_id = $1 AND status = 'ativo'`,
      [loja_id]
    );

    const orcamentosPendentes = await pool.query(
      `SELECT COUNT(*) as total FROM orcamentos WHERE loja_id = $1 AND status = 'pendente'`,
      [loja_id]
    );

    const contasVencer = await pool.query(
      `SELECT COUNT(*) as total FROM contas_a_pagar 
       WHERE loja_id = $1 AND status = 'a_vencer' 
       AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`,
      [loja_id]
    );

    res.json({
      vendas_hoje: parseFloat(vendasHoje.rows[0].total),
      vendas_mes: parseFloat(vendasMes.rows[0].total),
      total_produtos: parseInt(totalProdutos.rows[0].total),
      total_clientes: parseInt(totalClientes.rows[0].total),
      orcamentos_pendentes: parseInt(orcamentosPendentes.rows[0].total),
      contas_vencer_semana: parseInt(contasVencer.rows[0].total)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      `SELECT id, nome_exibicao, slug, cnpj, email, telefone, whatsapp,
              endereco, cidade, estado, cep, inscricao_estadual,
              logo, cor_primaria, cor_secundaria, status
       FROM lojas WHERE id = $1`,
      [loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Loja não encontrada' });

    const nfeSeq = await pool.query('SELECT ultimo_numero FROM sequencias_nfe WHERE loja_id = $1', [loja_id]);

    const loja = resultado.rows[0];
    loja.ultimo_numero_nfe = nfeSeq.rows[0]?.ultimo_numero || 0;

    res.json({ loja });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { nome_exibicao, cnpj, email, telefone, whatsapp, endereco, cidade, estado, cep, inscricao_estadual, logo, cor_primaria, cor_secundaria } = req.body;

    const resultado = await pool.query(
      `UPDATE lojas SET
        nome_exibicao = COALESCE($1, nome_exibicao),
        cnpj = COALESCE($2, cnpj),
        email = COALESCE($3, email),
        telefone = COALESCE($4, telefone),
        whatsapp = COALESCE($5, whatsapp),
        endereco = COALESCE($6, endereco),
        cidade = COALESCE($7, cidade),
        estado = COALESCE($8, estado),
        cep = COALESCE($9, cep),
        inscricao_estadual = COALESCE($10, inscricao_estadual),
        logo = COALESCE($11, logo),
        cor_primaria = COALESCE($12, cor_primaria),
        cor_secundaria = COALESCE($13, cor_secundaria),
        updated_at = NOW()
       WHERE id = $14 RETURNING *`,
      [nome_exibicao, cnpj, email, telefone, whatsapp, endereco, cidade, estado, cep, inscricao_estadual, logo, cor_primaria, cor_secundaria, loja_id]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ mensagem: 'Atualizada', loja: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/numeracao-nfe', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { ultimo_numero } = req.body;

    const existe = await pool.query('SELECT id FROM sequencias_nfe WHERE loja_id = $1', [loja_id]);

    if (existe.rows.length === 0) {
      await pool.query('INSERT INTO sequencias_nfe (loja_id, ultimo_numero) VALUES ($1, $2)', [loja_id, ultimo_numero]);
    } else {
      await pool.query('UPDATE sequencias_nfe SET ultimo_numero = $1 WHERE loja_id = $2', [ultimo_numero, loja_id]);
    }

    res.json({ mensagem: 'Atualizada', ultimo_numero });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;