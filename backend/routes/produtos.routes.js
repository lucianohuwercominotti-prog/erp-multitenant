const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// GET /api/loja/:slug/produtos - Listar produtos públicos
router.get('/loja/:slug/produtos', async (req, res) => {
  try {
    const { slug } = req.params;
    const { busca, categoria_id, ordem, pagina = 1, limit = 12 } = req.query;

    const lojaResult = await pool.query(
      'SELECT id FROM lojas WHERE slug = $1 AND status = $2',
      [slug, 'ativa']
    );

    if (lojaResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const loja_id = lojaResult.rows[0].id;
    const offset = (parseInt(pagina) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, c.nome as categoria_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.loja_id = $1 AND p.status = 'ativo'
    `;
    let countQuery = `SELECT COUNT(*) FROM produtos p WHERE p.loja_id = $1 AND p.status = 'ativo'`;
    const params = [loja_id];
    const countParams = [loja_id];
    let paramIndex = 2;

    if (busca && busca.trim()) {
      query += ` AND (LOWER(p.nome) LIKE LOWER($${paramIndex}) OR LOWER(p.descricao) LIKE LOWER($${paramIndex}) OR LOWER(p.codigo_sku) LIKE LOWER($${paramIndex}))`;
      countQuery += ` AND (LOWER(p.nome) LIKE LOWER($${paramIndex}) OR LOWER(p.descricao) LIKE LOWER($${paramIndex}) OR LOWER(p.codigo_sku) LIKE LOWER($${paramIndex}))`;
      params.push(`%${busca.trim()}%`);
      countParams.push(`%${busca.trim()}%`);
      paramIndex++;
    }

    if (categoria_id) {
      query += ` AND p.categoria_id = $${paramIndex}`;
      countQuery += ` AND p.categoria_id = $${paramIndex}`;
      params.push(categoria_id);
      countParams.push(categoria_id);
      paramIndex++;
    }

    switch (ordem) {
      case 'menor_preco': query += ' ORDER BY p.preco_venda ASC'; break;
      case 'maior_preco': query += ' ORDER BY p.preco_venda DESC'; break;
      case 'nome_az': query += ' ORDER BY p.nome ASC'; break;
      default: query += ' ORDER BY p.created_at DESC';
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const [produtosResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    res.json({
      produtos: produtosResult.rows,
      total: parseInt(countResult.rows[0].count),
      paginas: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      pagina_atual: parseInt(pagina)
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/loja/:slug/categorias - Listar categorias públicas
router.get('/loja/:slug/categorias', async (req, res) => {
  try {
    const { slug } = req.params;

    const lojaResult = await pool.query(
      'SELECT id FROM lojas WHERE slug = $1 AND status = $2',
      [slug, 'ativa']
    );

    if (lojaResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const loja_id = lojaResult.rows[0].id;

    const resultado = await pool.query(
      `SELECT c.id, c.nome, c.descricao, COUNT(p.id) as total_produtos
       FROM categorias c
       LEFT JOIN produtos p ON c.id = p.categoria_id AND p.status = 'ativo'
       WHERE c.loja_id = $1 AND c.status = 'ativa'
       GROUP BY c.id, c.nome, c.descricao
       ORDER BY c.nome`,
      [loja_id]
    );

    res.json({ categorias: resultado.rows });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/loja/:slug/produtos/:id - Detalhes do produto público
router.get('/loja/:slug/produtos/:id', async (req, res) => {
  try {
    const { slug, id } = req.params;

    const lojaResult = await pool.query(
      'SELECT id FROM lojas WHERE slug = $1 AND status = $2',
      [slug, 'ativa']
    );

    if (lojaResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const loja_id = lojaResult.rows[0].id;

    const resultado = await pool.query(
      `SELECT p.*, c.nome as categoria_nome
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1 AND p.loja_id = $2 AND p.status = 'ativo'`,
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ produto: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ============================================
// ROTAS PROTEGIDAS (com autenticação)
// ============================================

// POST /api/produtos/importar-json - DEVE VIR ANTES DE /:id
router.post('/importar-json', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { produtos } = req.body;
    const loja_id = req.usuario.loja_id;

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({ erro: 'Lista de produtos inválida' });
    }

    await client.query('BEGIN');

    const categoriasCriadas = [];
    let produtosImportados = 0;

    for (const produto of produtos) {
      let categoria_id = null;
      
      if (produto.categoria) {
        const catExistente = await client.query(
          'SELECT id FROM categorias WHERE loja_id = $1 AND LOWER(nome) = LOWER($2)',
          [loja_id, produto.categoria.trim()]
        );

        if (catExistente.rows.length > 0) {
          categoria_id = catExistente.rows[0].id;
        } else {
          const novaCat = await client.query(
            'INSERT INTO categorias (loja_id, nome, status) VALUES ($1, $2, $3) RETURNING id',
            [loja_id, produto.categoria.trim(), 'ativa']
          );
          categoria_id = novaCat.rows[0].id;
          categoriasCriadas.push(produto.categoria.trim());
        }
      }

      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const codigo_sku = produto.codigo?.trim() || `LOJA${loja_id}-${timestamp}-${random}`;

      const skuExiste = await client.query('SELECT id FROM produtos WHERE codigo_sku = $1', [codigo_sku]);

      let skuFinal = codigo_sku;
      if (skuExiste.rows.length > 0) {
        skuFinal = `LOJA${loja_id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }

      await client.query(
        `INSERT INTO produtos (loja_id, categoria_id, nome, codigo_sku, descricao, preco_venda, preco_custo, estoque_atual, estoque_minimo, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [loja_id, categoria_id, produto.nome.trim(), skuFinal, produto.descricao || '', produto.preco_venda || produto.preco || 0, produto.preco_custo || 0, produto.estoque_atual || produto.estoque || 0, produto.estoque_minimo || 0, 'ativo']
      );

      produtosImportados++;
    }

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      importados: produtosImportados,
      categorias_criadas: [...new Set(categoriasCriadas)]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao importar produtos' });
  } finally {
    client.release();
  }
});

// GET /api/produtos - Listar produtos da loja (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { busca, categoria_id, status, pagina = 1, limit = 20 } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limit);

    let query = `
      SELECT p.*, c.nome as categoria_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.loja_id = $1
    `;
    let countQuery = `SELECT COUNT(*) FROM produtos p WHERE p.loja_id = $1`;
    const params = [loja_id];
    const countParams = [loja_id];
    let paramIndex = 2;

    if (busca && busca.trim()) {
      query += ` AND (LOWER(p.nome) LIKE LOWER($${paramIndex}) OR LOWER(p.codigo_sku) LIKE LOWER($${paramIndex}))`;
      countQuery += ` AND (LOWER(p.nome) LIKE LOWER($${paramIndex}) OR LOWER(p.codigo_sku) LIKE LOWER($${paramIndex}))`;
      params.push(`%${busca.trim()}%`);
      countParams.push(`%${busca.trim()}%`);
      paramIndex++;
    }

    if (categoria_id) {
      query += ` AND p.categoria_id = $${paramIndex}`;
      countQuery += ` AND p.categoria_id = $${paramIndex}`;
      params.push(categoria_id);
      countParams.push(categoria_id);
      paramIndex++;
    }

    if (status && status !== 'todos') {
      query += ` AND p.status = $${paramIndex}`;
      countQuery += ` AND p.status = $${paramIndex}`;
      params.push(status);
      countParams.push(status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const [produtosResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    res.json({
      produtos: produtosResult.rows,
      total: parseInt(countResult.rows[0].count),
      paginas: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      pagina_atual: parseInt(pagina)
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/produtos - Criar produto (admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const loja_id = req.usuario.loja_id;
    const { nome, categoria_id, descricao, preco_venda, preco_custo, estoque_atual, estoque_minimo, imagem, status = 'ativo' } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    if (!preco_venda || parseFloat(preco_venda) <= 0) {
      return res.status(400).json({ erro: 'Preço de venda inválido' });
    }

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const codigo_sku = `LOJA${loja_id}-${timestamp}-${random}`;

    const resultado = await pool.query(
      `INSERT INTO produtos (loja_id, categoria_id, nome, codigo_sku, descricao, preco_venda, preco_custo, estoque_atual, estoque_minimo, imagem, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [loja_id, categoria_id || null, nome.trim(), codigo_sku, descricao || '', parseFloat(preco_venda), parseFloat(preco_custo) || 0, parseInt(estoque_atual) || 0, parseInt(estoque_minimo) || 0, imagem || null, status]
    );

    res.status(201).json({ mensagem: 'Produto criado', produto: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/produtos/:id - Buscar produto por ID (admin) - DEVE VIR POR ÚLTIMO
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    // Validar se id é um número
    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    const resultado = await pool.query(
      `SELECT p.*, c.nome as categoria_nome
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1 AND p.loja_id = $2`,
      [id, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ produto: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /api/produtos/:id - Atualizar produto (admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;
    const { nome, categoria_id, descricao, preco_venda, preco_custo, estoque_atual, estoque_minimo, imagem, status } = req.body;

    const produtoExiste = await pool.query('SELECT id FROM produtos WHERE id = $1 AND loja_id = $2', [id, loja_id]);
    if (produtoExiste.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const resultado = await pool.query(
      `UPDATE produtos SET nome=$1, categoria_id=$2, descricao=$3, preco_venda=$4, preco_custo=$5, estoque_atual=$6, estoque_minimo=$7, imagem=$8, status=$9, updated_at=NOW()
       WHERE id=$10 AND loja_id=$11 RETURNING *`,
      [nome.trim(), categoria_id || null, descricao || '', parseFloat(preco_venda), parseFloat(preco_custo) || 0, parseInt(estoque_atual) || 0, parseInt(estoque_minimo) || 0, imagem || null, status || 'ativo', id, loja_id]
    );

    res.json({ mensagem: 'Produto atualizado', produto: resultado.rows[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/produtos/:id - Excluir produto (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loja_id = req.usuario.loja_id;

    const resultado = await pool.query('DELETE FROM produtos WHERE id = $1 AND loja_id = $2 RETURNING id', [id, loja_id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ mensagem: 'Produto excluído' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;