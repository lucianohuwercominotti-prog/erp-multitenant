const db = require('../config/database');
const { validarEmail, validarCpfCnpj } = require('../middleware/validations');

// LISTAR CLIENTES
const listarClientes = async (req, res) => {
    try {
        const { loja_id } = req.usuario;
        const { busca, status, pagina = 1, limite = 20 } = req.query;

        let whereConditions = ['loja_id = $1'];
        let params = [loja_id];
        let paramCount = 1;

        if (busca) {
            paramCount++;
            whereConditions.push(`(
                LOWER(nome) LIKE $${paramCount} OR 
                LOWER(email) LIKE $${paramCount} OR 
                LOWER(cpf_cnpj) LIKE $${paramCount}
            )`);
            params.push(`%${busca.toLowerCase()}%`);
        }

        if (status) {
            paramCount++;
            whereConditions.push(`status = $${paramCount}`);
            params.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM clientes WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const offset = (pagina - 1) * limite;

        const result = await db.query(
            `SELECT id, nome, email, cpf_cnpj, telefone, cidade, estado, status, created_at
             FROM clientes
             WHERE ${whereClause}
             ORDER BY nome
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...params, limite, offset]
        );

        res.json({
            clientes: result.rows,
            paginacao: {
                pagina_atual: parseInt(pagina),
                limite: parseInt(limite),
                total_clientes: total,
                total_paginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({ erro: 'Erro ao listar clientes' });
    }
};

// BUSCAR CLIENTE POR ID
const buscarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            `SELECT id, nome, email, cpf_cnpj, telefone, endereco, 
                    cidade, estado, cep, status, created_at
             FROM clientes
             WHERE id = $1 AND loja_id = $2`,
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente nao encontrado' });
        }

        // Buscar histórico de compras
        const vendas = await db.query(
            `SELECT id, numero_venda, data_venda, total, status
             FROM vendas
             WHERE cliente_id = $1 AND loja_id = $2
             ORDER BY data_venda DESC
             LIMIT 10`,
            [id, loja_id]
        );

        res.json({
            cliente: result.rows[0],
            historico_vendas: vendas.rows
        });

    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({ erro: 'Erro ao buscar cliente' });
    }
};

// ATUALIZAR CLIENTE
const atualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;
        const { nome, email, cpf_cnpj, telefone, endereco, cidade, estado, cep, status } = req.body;

        if (email && !validarEmail(email)) {
            return res.status(400).json({ erro: 'Email invalido' });
        }

        if (cpf_cnpj && !validarCpfCnpj(cpf_cnpj)) {
            return res.status(400).json({ erro: 'CPF/CNPJ invalido' });
        }

        const result = await db.query(
            `UPDATE clientes SET
                nome = COALESCE($1, nome),
                email = COALESCE($2, email),
                cpf_cnpj = COALESCE($3, cpf_cnpj),
                telefone = COALESCE($4, telefone),
                endereco = COALESCE($5, endereco),
                cidade = COALESCE($6, cidade),
                estado = COALESCE($7, estado),
                cep = COALESCE($8, cep),
                status = COALESCE($9, status),
                updated_at = NOW()
             WHERE id = $10 AND loja_id = $11
             RETURNING id, nome, email, cpf_cnpj, telefone, cidade, estado, status`,
            [nome, email, cpf_cnpj, telefone, endereco, cidade, estado, cep, status, id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente nao encontrado' });
        }

        res.json({
            mensagem: 'Cliente atualizado com sucesso',
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ erro: 'Erro ao atualizar cliente' });
    }
};

// DESATIVAR CLIENTE
const desativarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { loja_id } = req.usuario;

        const result = await db.query(
            `UPDATE clientes SET status = 'inativo', updated_at = NOW()
             WHERE id = $1 AND loja_id = $2
             RETURNING id, nome, status`,
            [id, loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente nao encontrado' });
        }

        res.json({
            mensagem: 'Cliente desativado com sucesso',
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao desativar cliente:', error);
        res.status(500).json({ erro: 'Erro ao desativar cliente' });
    }
};

module.exports = {
    listarClientes,
    buscarCliente,
    atualizarCliente,
    desativarCliente
};