const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Cadastro de Admin
router.post('/admin/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nome, email, senha, cpf_cnpj, telefone, nome_loja } = req.body;

    if (!nome || !email || !senha || !cpf_cnpj || !nome_loja) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    await client.query('BEGIN');

    const emailExiste = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailExiste.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const slug = nome_loja.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const lojaResult = await client.query(
      'INSERT INTO lojas (nome_exibicao, slug, telefone, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome_loja, slug, telefone, 'ativa']
    );

    const loja_id = lojaResult.rows[0].id;
    const senhaHash = await bcrypt.hash(senha, 10);

    const usuarioResult = await client.query(
      'INSERT INTO usuarios (loja_id, nome, email, senha, cpf_cnpj, telefone, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nome, email',
      [loja_id, nome, email, senhaHash, cpf_cnpj, telefone, 'admin', 'ativo']
    );

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: usuarioResult.rows[0].id, email, loja_id, tipo: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensagem: 'Loja e usuário criados com sucesso',
      token,
      usuario: { ...usuarioResult.rows[0], loja_id },
      slug
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro no cadastro:', error);
    res.status(500).json({ erro: 'Erro ao cadastrar', detalhes: error.message });
  } finally {
    client.release();
  }
});

// Login de Admin
router.post('/admin/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const resultado = await pool.query(
      'SELECT u.*, l.slug FROM usuarios u JOIN lojas l ON u.loja_id = l.id WHERE u.email = $1',
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const usuario = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, loja_id: usuario.loja_id, tipo: 'admin', role: usuario.role },
      process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        loja_id: usuario.loja_id,
        slug: usuario.slug
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;
