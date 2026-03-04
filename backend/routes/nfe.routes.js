const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Função auxiliar para gerar próximo número de NF-e
const proximoNumeroNfe = async (loja_id, client) => {
  const resultado = await client.query(
    'SELECT ultimo_numero FROM sequencias_nfe WHERE loja_id = $1 FOR UPDATE',
    [loja_id]
  );

  let numero;
  if (resultado.rows.length === 0) {
    await client.query(
      'INSERT INTO sequencias_nfe (loja_id, ultimo_numero) VALUES ($1, 1)',
      [loja_id]
    );
    numero = 1;
  } else {
    numero = resultado.rows[0].ultimo_numero + 1;
    await client.query(
      'UPDATE sequencias_nfe SET ultimo_numero = $1 WHERE loja_id = $2',
      [numero, loja_id]
    );
  }

  return numero.toString().padStart(9, '0');
};

// GET /api/nfe - Listar Notas Fiscais
router.get('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { tipo, status } = req.query;

    let query = `
      SELECT nf.*, c.nome as cliente_nome
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
      WHERE nf.loja_id = $1
    `;
    const params = [loja_id];
    let idx = 2;

    if (tipo) {
      query += ` AND nf.tipo = $${idx++}`;
      params.push(tipo);
    }

    if (status) {
      query += ` AND nf.status = $${idx++}`;
      params.push(status);
    }

    query += ' ORDER BY nf.created_at DESC';

    const resultado = await pool.query(query, params);
    res.json({ notas: resultado.rows });
  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/nfe/:id - Detalhes de uma NF-e
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const nota = await pool.query(
      `SELECT nf.*, 
              c.nome as cliente_nome, c.cpf_cnpj as cliente_documento,
              c.endereco as cliente_endereco, c.cidade as cliente_cidade,
              c.estado as cliente_estado, c.cep as cliente_cep,
              l.nome_exibicao as loja_nome, l.cnpj as loja_cnpj, 
              l.endereco as loja_endereco, l.cidade as loja_cidade, 
              l.estado as loja_estado, l.telefone as loja_telefone
       FROM notas_fiscais nf
       LEFT JOIN clientes c ON nf.cliente_id = c.id
       LEFT JOIN lojas l ON nf.loja_id = l.id
       WHERE nf.id = $1 AND nf.loja_id = $2`,
      [id, loja_id]
    );

    if (nota.rows.length === 0) {
      return res.status(404).json({ erro: 'Nota fiscal não encontrada' });
    }

    const itens = await pool.query(
      `SELECT ni.*, p.nome as produto_nome, p.codigo_sku
       FROM notas_fiscais_itens ni
       LEFT JOIN produtos p ON ni.produto_id = p.id
       WHERE ni.nota_fiscal_id = $1`,
      [id]
    );

    res.json({ nota: nota.rows[0], itens: itens.rows });
  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/nfe/entrada - Registrar NF-e de Entrada
router.post('/entrada', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const loja_id = req.usuario.loja_id;
    const { fornecedor, numero_nfe, serie, data_emissao, itens, observacoes } = req.body;

    if (!fornecedor || !numero_nfe || !itens || itens.length === 0) {
      return res.status(400).json({ erro: 'Dados incompletos: fornecedor, número e itens são obrigatórios' });
    }

    await client.query('BEGIN');

    const valorTotal = itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);

    const notaResult = await client.query(
      `INSERT INTO notas_fiscais 
        (loja_id, tipo, numero_nfe, serie, data_emissao, fornecedor, valor_total, status, observacoes)
       VALUES ($1, 'entrada', $2, $3, $4, $5, $6, 'emitida', $7) 
       RETURNING *`,
      [loja_id, numero_nfe, serie || '1', data_emissao, fornecedor, valorTotal, observacoes || '']
    );

    const nota_id = notaResult.rows[0].id;

    for (const item of itens) {
      await client.query(
        `INSERT INTO notas_fiscais_itens 
          (nota_fiscal_id, produto_id, descricao, quantidade, preco_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nota_id, item.produto_id, item.descricao || '', item.quantidade, item.preco_unitario, item.quantidade * item.preco_unitario]
      );

      if (item.produto_id) {
        await client.query(
          'UPDATE produtos SET estoque_atual = estoque_atual + $1, preco_custo = $2 WHERE id = $3',
          [item.quantidade, item.preco_unitario, item.produto_id]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ mensagem: 'NF-e de entrada registrada com sucesso', nota: notaResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar NF-e de entrada:', error);
    res.status(500).json({ erro: 'Erro interno' });
  } finally {
    client.release();
  }
});

// POST /api/nfe/saida - Emitir NF-e de Saída
router.post('/saida', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const loja_id = req.usuario.loja_id;
    const { cliente_id, venda_id, itens, observacoes } = req.body;

    if (!cliente_id || !itens || itens.length === 0) {
      return res.status(400).json({ erro: 'Cliente e itens são obrigatórios' });
    }

    await client.query('BEGIN');

    const numero_nfe = await proximoNumeroNfe(loja_id, client);
    const valorTotal = itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);

    const chaveAcesso = `${loja_id}`.padStart(2, '0') +
                        new Date().toISOString().replace(/\D/g, '').substring(0, 12) +
                        numero_nfe.padStart(9, '0') +
                        Math.random().toString().substring(2, 23);

    const notaResult = await client.query(
      `INSERT INTO notas_fiscais 
        (loja_id, tipo, numero_nfe, serie, data_emissao, cliente_id, venda_id, valor_total, status, chave_acesso, observacoes)
       VALUES ($1, 'saida', $2, '1', NOW(), $3, $4, $5, 'emitida', $6, $7) 
       RETURNING *`,
      [loja_id, numero_nfe, cliente_id, venda_id || null, valorTotal, chaveAcesso.substring(0, 44), observacoes || '']
    );

    const nota_id = notaResult.rows[0].id;

    for (const item of itens) {
      await client.query(
        `INSERT INTO notas_fiscais_itens 
          (nota_fiscal_id, produto_id, descricao, quantidade, preco_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nota_id, item.produto_id, item.descricao || '', item.quantidade, item.preco_unitario, item.quantidade * item.preco_unitario]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      mensagem: 'NF-e de saída emitida com sucesso', 
      nota: notaResult.rows[0], 
      numero: numero_nfe 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao emitir NF-e de saída:', error);
    res.status(500).json({ erro: 'Erro interno' });
  } finally {
    client.release();
  }
});

// POST /api/nfe/gerar-da-venda/:vendaId - Gerar NF-e a partir de uma venda
router.post('/gerar-da-venda/:vendaId', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { vendaId } = req.params;
    const loja_id = req.usuario.loja_id;

    const vendaResult = await client.query(
      `SELECT v.*, c.id as cliente_id 
       FROM vendas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       WHERE v.id = $1 AND v.loja_id = $2`,
      [vendaId, loja_id]
    );

    if (vendaResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }

    const venda = vendaResult.rows[0];

    const nfeExiste = await client.query(
      'SELECT id FROM notas_fiscais WHERE venda_id = $1',
      [vendaId]
    );

    if (nfeExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'Já existe NF-e para esta venda' });
    }

    const itensResult = await client.query(
      `SELECT vi.*, p.nome as produto_nome 
       FROM vendas_itens vi 
       LEFT JOIN produtos p ON vi.produto_id = p.id 
       WHERE vi.venda_id = $1`,
      [vendaId]
    );

    await client.query('BEGIN');

    const numero_nfe = await proximoNumeroNfe(loja_id, client);
    const chaveAcesso = `${loja_id}`.padStart(2, '0') +
                        new Date().toISOString().replace(/\D/g, '').substring(0, 12) +
                        numero_nfe.padStart(9, '0') +
                        Math.random().toString().substring(2, 23);

    const notaResult = await client.query(
      `INSERT INTO notas_fiscais 
        (loja_id, tipo, numero_nfe, serie, data_emissao, cliente_id, venda_id, valor_total, status, chave_acesso)
       VALUES ($1, 'saida', $2, '1', NOW(), $3, $4, $5, 'emitida', $6) 
       RETURNING *`,
      [loja_id, numero_nfe, venda.cliente_id, vendaId, venda.total, chaveAcesso.substring(0, 44)]
    );

    const nota_id = notaResult.rows[0].id;

    for (const item of itensResult.rows) {
      await client.query(
        `INSERT INTO notas_fiscais_itens 
          (nota_fiscal_id, produto_id, descricao, quantidade, preco_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nota_id, item.produto_id, item.produto_nome || '', item.quantidade, item.preco_unitario, item.subtotal]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      mensagem: 'NF-e gerada a partir da venda com sucesso', 
      nota: notaResult.rows[0], 
      numero: numero_nfe 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao gerar NF-e da venda:', error);
    res.status(500).json({ erro: 'Erro interno' });
  } finally {
    client.release();
  }
});

// DELETE /api/nfe/:id - Cancelar NF-e
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query(
      `UPDATE notas_fiscais 
       SET status = 'cancelada', updated_at = NOW() 
       WHERE id = $1 AND loja_id = $2 
       RETURNING *`,
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Nota fiscal não encontrada' });
    }

    res.json({ mensagem: 'NF-e cancelada com sucesso', nota: resultado.rows[0] });
  } catch (error) {
    console.error('Erro ao cancelar NF-e:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;