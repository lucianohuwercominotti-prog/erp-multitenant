const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

// POST /api/auth/admin/register - Cadastro de admin
router.post('/admin/register', async (req, res) => {
  try {
    const { nome, email, senha, nome_loja, cnpj, telefone } = req.body;

    if (!nome || !email || !senha || !nome_loja) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    }

    // Verificar se email já existe
    const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado' });
    }

    // Criar slug da loja
    const slug = nome_loja
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Verificar se slug já existe
    const slugExiste = await pool.query('SELECT id FROM lojas WHERE slug = $1', [slug]);
    if (slugExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'Já existe uma loja com este nome' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar loja
    const lojaResult = await pool.query(
      `INSERT INTO lojas (nome_exibicao, slug, telefone, status)
       VALUES ($1, $2, $3, 'ativa') RETURNING id`,
      [nome_loja, slug, telefone || null]
    );

    const loja_id = lojaResult.rows[0].id;

    // Criar usuário admin
    const usuarioResult = await pool.query(
      `INSERT INTO usuarios (loja_id, nome, email, senha, cpf_cnpj, telefone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'ativo') RETURNING id, nome, email`,
      [loja_id, nome, email, senhaHash, cnpj || '', telefone || '']
    );

    const usuario = usuarioResult.rows[0];

    // Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, loja_id, tipo: 'admin', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        loja_id,
        tipo: 'admin',
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /api/auth/admin/login - Login de admin
router.post('/admin/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }

    // Buscar usuário
    const resultado = await pool.query(
      `SELECT u.*, l.slug as loja_slug, l.nome_exibicao as loja_nome
       FROM usuarios u
       JOIN lojas l ON u.loja_id = l.id
       WHERE u.email = $1 AND u.status = 'ativo'`,
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const usuario = resultado.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, loja_id: usuario.loja_id, tipo: 'admin', role: usuario.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        loja_id: usuario.loja_id,
        loja_slug: usuario.loja_slug,
        loja_nome: usuario.loja_nome,
        tipo: 'admin',
        role: usuario.role
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /api/auth/cliente/register - Cadastro de cliente
router.post('/cliente/register', async (req, res) => {
  try {
    const { nome, email, senha, cpf_cnpj, telefone, slug } = req.body;

    if (!nome || !email || !senha || !cpf_cnpj || !telefone || !slug) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    }

    // Buscar loja pelo slug
    const lojaResult = await pool.query(
      'SELECT id FROM lojas WHERE slug = $1 AND status = $2',
      [slug, 'ativa']
    );

    if (lojaResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const loja_id = lojaResult.rows[0].id;

    // Verificar se email já existe nesta loja
    const emailExiste = await pool.query(
      'SELECT id FROM clientes WHERE email = $1 AND loja_id = $2',
      [email, loja_id]
    );

    if (emailExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado nesta loja' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar cliente
    const clienteResult = await pool.query(
      `INSERT INTO clientes (loja_id, nome, email, senha, cpf_cnpj, telefone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ativo') RETURNING id, nome, email`,
      [loja_id, nome, email, senhaHash, cpf_cnpj, telefone]
    );

    const cliente = clienteResult.rows[0];

    // Gerar token
    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, loja_id, tipo: 'cliente' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso',
      token,
      usuario: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        loja_id,
        tipo: 'cliente'
      }
    });

  } catch (error) {
    console.error('Erro no cadastro cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /api/auth/cliente/login - Login de cliente
router.post('/cliente/login', async (req, res) => {
  try {
    const { email, senha, slug } = req.body;

    if (!email || !senha || !slug) {
      return res.status(400).json({ erro: 'E-mail, senha e loja são obrigatórios' });
    }

    // Buscar loja pelo slug
    const lojaResult = await pool.query(
      'SELECT id FROM lojas WHERE slug = $1 AND status = $2',
      [slug, 'ativa']
    );

    if (lojaResult.rows.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const loja_id = lojaResult.rows[0].id;

    // Buscar cliente
    const resultado = await pool.query(
      `SELECT * FROM clientes WHERE email = $1 AND loja_id = $2 AND status = 'ativo'`,
      [email, loja_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const cliente = resultado.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, loja_id, tipo: 'cliente' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        loja_id,
        tipo: 'cliente'
      }
    });

  } catch (error) {
    console.error('Erro no login cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
