const db = require('../config/database');
const { gerarSKU } = require('../utils/skuGenerator');
const { validarCamposObrigatorios } = require('../middleware/validations');

// ============================================
// LISTAR PRODUTOS (com filtros e paginação)
// ============================================
const listarProdutos = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { 
            busca, 
            categoria_id, 
            status, 
            pagina = 1, 
            limite = 20 
        } = req.query;

        let whereConditions = ['p.loja_id = $1'];
        let queryParams = [loja_id];
        let paramCount = 1;

        // Filtro de busca (nome, SKU ou descrição)
        if (busca) {
            paramCount++;
            whereConditions.push(`(
                LOWER(p.nome) LIKE $${paramCount} OR 
                LOWER(p.codigo_sku) LIKE $${paramCount} OR 
                LOWER(p.descricao) LIKE $${paramCount}
            )`);
            queryParams.push(`%${busca.toLowerCase()}%`);
        }

        // Filtro de categoria
        if (categoria_id) {
            paramCount++;
            whereConditions.push(`p.categoria_id = $${paramCount}`);
            queryParams.push(categoria_id);
        }

        // Filtro de status
        if (status) {
            paramCount++;
            whereConditions.push(`p.status = $${paramCount}`);
            queryParams.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total de produtos
        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM produtos p WHERE ${whereClause}`,
            queryParams
        );

        const total = parseInt(countResult.rows[0].total);

        // Calcular offset
        const offset = (pagina - 1) * limite;

        // Buscar produtos
        const result = await db.query(
            `SELECT p.id, p.nome, p.codigo_sku, p.descricao, p.preco_venda, 
                    p.preco_custo, p.estoque_atual, p.estoque_minimo, p.imagem, 
                    p.status, p.created_at, p.updated_at,
                    c.nome as categoria_nome, c.id as categoria_id
             FROM produtos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE ${whereClause}
             ORDER BY p.created_at DESC
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...queryParams, limite, offset]
        );

        res.json({
            produtos: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_produtos: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ erro: 'Erro ao listar produtos' });
    }
};

// ============================================
// BUSCAR PRODUTO POR ID
// ============================================
const buscarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            `SELECT p.*, c.nome as categoria_nome
             FROM produtos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.id = $1 AND p.loja_id = $2`,
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto nao encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ erro: 'Erro ao buscar produto' });
    }
};

// ============================================
// CRIAR PRODUTO
// ============================================
const criarProduto = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const {
            categoria_id,
            nome,
            descricao,
            preco_venda,
            preco_custo,
            estoque_inicial,
            estoque_minimo,
            imagem,
            status
        } = req.body;

        // Validar campos obrigatórios
        const camposFaltando = validarCamposObrigatorios(
            ['nome', 'preco_venda'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        // Validar preço
        if (preco_venda <= 0) {
            return res.status(400).json({ erro: 'Preco de venda deve ser maior que zero' });
        }

        // Gerar SKU único
        let sku = gerarSKU(loja_id);

        // Verificar se SKU já existe (improvável, mas por segurança)
        let skuExiste = true;
        let tentativas = 0;

        while (skuExiste && tentativas < 5) {
            const checkSku = await db.query(
                'SELECT id FROM produtos WHERE codigo_sku = $1',
                [sku]
            );

            if (checkSku.rows.length === 0) {
                skuExiste = false;
            } else {
                sku = gerarSKU(loja_id);
                tentativas++;
            }
        }

        if (skuExiste) {
            return res.status(500).json({ erro: 'Erro ao gerar SKU unico' });
        }

        // Inserir produto
        const result = await db.query(
            `INSERT INTO produtos (
                loja_id, categoria_id, nome, codigo_sku, descricao,
                preco_venda, preco_custo, estoque_atual, estoque_minimo,
                imagem, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                loja_id,
                categoria_id || null,
                nome,
                sku,
                descricao || null,
                preco_venda,
                preco_custo || null,
                estoque_inicial || 0,
                estoque_minimo || 0,
                imagem || null,
                status || 'ativo'
            ]
        );

        res.status(201).json({
            mensagem: 'Produto criado com sucesso',
            produto: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ erro: 'Erro ao criar produto' });
    }
};

// ============================================
// ATUALIZAR PRODUTO
// ============================================
const atualizarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;
        const {
            categoria_id,
            nome,
            descricao,
            preco_venda,
            preco_custo,
            estoque_minimo,
            imagem,
            status
        } = req.body;

        // Verificar se produto existe e pertence à loja
        const produtoExiste = await db.query(
            'SELECT id FROM produtos WHERE id = $1 AND loja_id = $2',
            [id, loja_id]
        );

        if (produtoExiste.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto nao encontrado' });
        }

        // Validar preço se informado
        if (preco_venda !== undefined && preco_venda <= 0) {
            return res.status(400).json({ erro: 'Preco de venda deve ser maior que zero' });
        }

        // Atualizar produto
        const result = await db.query(
            `UPDATE produtos SET
                categoria_id = COALESCE($1, categoria_id),
                nome = COALESCE($2, nome),
                descricao = COALESCE($3, descricao),
                preco_venda = COALESCE($4, preco_venda),
                preco_custo = COALESCE($5, preco_custo),
                estoque_minimo = COALESCE($6, estoque_minimo),
                imagem = COALESCE($7, imagem),
                status = COALESCE($8, status),
                updated_at = NOW()
             WHERE id = $9 AND loja_id = $10
             RETURNING *`,
            [
                categoria_id,
                nome,
                descricao,
                preco_venda,
                preco_custo,
                estoque_minimo,
                imagem,
                status,
                id,
                loja_id
            ]
        );

        res.json({
            mensagem: 'Produto atualizado com sucesso',
            produto: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ erro: 'Erro ao atualizar produto' });
    }
};

// ============================================
// EXCLUIR PRODUTO
// ============================================
const excluirProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        // Verificar se produto existe
        const produtoExiste = await db.query(
            'SELECT id FROM produtos WHERE id = $1 AND loja_id = $2',
            [id, loja_id]
        );

        if (produtoExiste.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto nao encontrado' });
        }

        // Verificar se produto está em vendas ou orçamentos
        const emUso = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM vendas_itens WHERE produto_id = $1) +
                (SELECT COUNT(*) FROM orcamentos_itens WHERE produto_id = $1) as total`,
            [id]
        );

        if (parseInt(emUso.rows[0].total) > 0) {
            return res.status(400).json({ 
                erro: 'Produto nao pode ser excluido pois esta vinculado a vendas ou orcamentos',
                sugestao: 'Voce pode desativar o produto alterando o status para inativo'
            });
        }

        // Excluir produto
        await db.query(
            'DELETE FROM produtos WHERE id = $1 AND loja_id = $2',
            [id, loja_id]
        );

        res.json({ mensagem: 'Produto excluido com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ erro: 'Erro ao excluir produto' });
    }
};

// ============================================
// IMPORTAR PRODUTOS VIA JSON
// ============================================
const importarJSON = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { produtos, preview } = req.body;

        // Validar se foi enviado array de produtos
        if (!Array.isArray(produtos) || produtos.length === 0) {
            return res.status(400).json({ 
                erro: 'Envie um array de produtos valido',
                exemplo: [
                    {
                        nome: "Produto Exemplo",
                        categoria: "Eletrônicos",
                        preco_venda: 100.00,
                        preco_custo: 50.00,
                        estoque: 10,
                        estoque_minimo: 2,
                        descricao: "Descrição do produto"
                    }
                ]
            });
        }

        // Limitar quantidade de produtos por importação
        if (produtos.length > 100) {
            return res.status(400).json({ 
                erro: 'Limite de 100 produtos por importacao',
                total_enviado: produtos.length
            });
        }

        const produtosValidados = [];
        const erros = [];
        const categoriasParaCriar = new Set();
        const categoriasExistentes = {};

        // Buscar categorias existentes da loja
        const categoriasResult = await db.query(
            'SELECT id, nome FROM categorias WHERE loja_id = $1',
            [loja_id]
        );

        categoriasResult.rows.forEach(cat => {
            categoriasExistentes[cat.nome.toLowerCase()] = cat.id;
        });

        // Validar cada produto
        for (let i = 0; i < produtos.length; i++) {
            const prod = produtos[i];
            const linha = i + 1;

            // Validar campos obrigatórios
            if (!prod.nome || !prod.preco_venda) {
                erros.push({
                    linha,
                    erro: 'Campos obrigatorios: nome e preco_venda',
                    produto: prod
                });
                continue;
            }

            // Validar preço
            const precoVenda = parseFloat(prod.preco_venda);
            if (isNaN(precoVenda) || precoVenda <= 0) {
                erros.push({
                    linha,
                    erro: 'Preco de venda invalido ou menor/igual a zero',
                    produto: prod
                });
                continue;
            }

            // Verificar categoria
            let categoria_id = null;
            if (prod.categoria) {
                const categoriaNome = prod.categoria.trim().toLowerCase();
                
                if (categoriasExistentes[categoriaNome]) {
                    categoria_id = categoriasExistentes[categoriaNome];
                } else {
                    // Marcar para criar categoria nova
                    categoriasParaCriar.add(prod.categoria.trim());
                }
            }

            // Gerar SKU
            const sku = gerarSKU(loja_id);

            // Montar produto validado
            produtosValidados.push({
                nome: prod.nome.trim(),
                categoria: prod.categoria ? prod.categoria.trim() : null,
                categoria_id,
                codigo_sku: sku,
                descricao: prod.descricao || null,
                preco_venda: precoVenda,
                preco_custo: prod.preco_custo ? parseFloat(prod.preco_custo) : null,
                estoque_atual: prod.estoque ? parseInt(prod.estoque) : 0,
                estoque_minimo: prod.estoque_minimo ? parseInt(prod.estoque_minimo) : 0,
                status: prod.status || 'ativo'
            });
        }

        // Se houver erros, retornar
        if (erros.length > 0) {
            return res.status(400).json({
                erro: 'Existem produtos com erros',
                total_produtos: produtos.length,
                total_validos: produtosValidados.length,
                total_erros: erros.length,
                erros: erros.slice(0, 10), // Mostrar apenas os 10 primeiros erros
                mensagem: erros.length > 10 ? 'Mostrando apenas os 10 primeiros erros' : null
            });
        }

        // Se for apenas preview, retornar dados validados sem salvar
        if (preview === true) {
            return res.json({
                mensagem: 'Preview da importacao - nenhum produto foi salvo',
                total_produtos: produtosValidados.length,
                categorias_novas: Array.from(categoriasParaCriar),
                produtos: produtosValidados
            });
        }

        // ===== EFETIVAR IMPORTAÇÃO =====

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Criar categorias novas
            const categoriasNovasCriadas = [];
            for (const categoriaNome of categoriasParaCriar) {
                const result = await client.query(
                    `INSERT INTO categorias (loja_id, nome, status)
                     VALUES ($1, $2, 'ativa')
                     RETURNING id, nome`,
                    [loja_id, categoriaNome]
                );
                
                const novaCat = result.rows[0];
                categoriasNovasCriadas.push(novaCat);
                categoriasExistentes[categoriaNome.toLowerCase()] = novaCat.id;
            }

            // Atualizar categoria_id dos produtos com categorias novas
            produtosValidados.forEach(prod => {
                if (prod.categoria && !prod.categoria_id) {
                    prod.categoria_id = categoriasExistentes[prod.categoria.toLowerCase()];
                }
            });

            // Inserir produtos
            const produtosInseridos = [];
            for (const prod of produtosValidados) {
                const result = await client.query(
                    `INSERT INTO produtos (
                        loja_id, categoria_id, nome, codigo_sku, descricao,
                        preco_venda, preco_custo, estoque_atual, estoque_minimo, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, nome, codigo_sku, preco_venda, estoque_atual`,
                    [
                        loja_id,
                        prod.categoria_id,
                        prod.nome,
                        prod.codigo_sku,
                        prod.descricao,
                        prod.preco_venda,
                        prod.preco_custo,
                        prod.estoque_atual,
                        prod.estoque_minimo,
                        prod.status
                    ]
                );
                
                produtosInseridos.push(result.rows[0]);
            }

            await client.query('COMMIT');

            res.status(201).json({
                mensagem: 'Produtos importados com sucesso',
                total_importados: produtosInseridos.length,
                categorias_criadas: categoriasNovasCriadas.length,
                categorias_novas: categoriasNovasCriadas,
                produtos: produtosInseridos
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao importar produtos:', error);
        res.status(500).json({ erro: 'Erro ao importar produtos' });
    }
};

module.exports = {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    importarJSON
};