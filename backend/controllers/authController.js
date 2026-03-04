const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validarEmail, validarCpfCnpj, sanitizarSlug, validarCamposObrigatorios } = require('../middleware/validations');

// ============================================
// CADASTRO DE ADMINISTRADOR (CRIA LOJA JUNTO)
// ============================================
const registerAdmin = async (req, res) => {
    try {
        const { nome, email, senha, cpf_cnpj, telefone, nome_loja, whatsapp } = req.body;

        // Validar campos obrigatórios
        const camposFaltando = validarCamposObrigatorios(
            ['nome', 'email', 'senha', 'cpf_cnpj', 'nome_loja'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        // Validar email
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'Email invalido' });
        }

        // Validar CPF/CNPJ
        if (!validarCpfCnpj(cpf_cnpj)) {
            return res.status(400).json({ erro: 'CPF/CNPJ invalido' });
        }

        // Validar senha (mínimo 6 caracteres)
        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter no minimo 6 caracteres' });
        }

        // Verificar se email já existe
        const emailExiste = await db.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (emailExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'Email ja cadastrado' });
        }

        // Gerar slug da loja
        const slug = sanitizarSlug(nome_loja);

        // Verificar se slug já existe
        const slugExiste = await db.query(
            'SELECT id FROM lojas WHERE slug = $1',
            [slug]
        );

        if (slugExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'Nome da loja ja existe. Escolha outro nome.' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Iniciar transação
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Criar loja
            const resultLoja = await client.query(
                `INSERT INTO lojas (nome_exibicao, slug, telefone, whatsapp, status)
                 VALUES ($1, $2, $3, $4, 'ativa')
                 RETURNING id, nome_exibicao, slug`,
                [nome_loja, slug, telefone || null, whatsapp || null]
            );

            const loja = resultLoja.rows[0];

            // Criar usuário admin
            const resultUsuario = await client.query(
                `INSERT INTO usuarios (loja_id, nome, email, senha, cpf_cnpj, telefone, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'ativo')
                 RETURNING id, nome, email, loja_id, role`,
                [loja.id, nome, email, senhaHash, cpf_cnpj, telefone || null]
            );

            const usuario = resultUsuario.rows[0];

            await client.query('COMMIT');

            // Gerar token
            const token = generateToken({
                id: usuario.id,
                email: usuario.email,
                loja_id: usuario.loja_id,
                role: usuario.role,
                tipo: 'admin'
            });

            res.status(201).json({
                mensagem: 'Administrador e loja criados com sucesso',
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    role: usuario.role
                },
                loja: {
                    id: loja.id,
                    nome: loja.nome_exibicao,
                    slug: loja.slug,
                    url: `/loja/${loja.slug}`
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erro ao cadastrar admin:', error);
        res.status(500).json({ erro: 'Erro ao cadastrar administrador' });
    }
};

// ============================================
// LOGIN DE ADMINISTRADOR
// ============================================
const loginAdmin = async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validar campos obrigatórios
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
        }

        // Validar email
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'Email invalido' });
        }

        // Buscar usuário
        const result = await db.query(
            `SELECT u.id, u.nome, u.email, u.senha, u.loja_id, u.role, u.status, 
                    l.nome_exibicao as loja_nome, l.slug as loja_slug, l.status as loja_status
             FROM usuarios u
             INNER JOIN lojas l ON u.loja_id = l.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = result.rows[0];

        // Verificar se usuário está ativo
        if (usuario.status !== 'ativo') {
            return res.status(403).json({ erro: 'Usuario desativado' });
        }

        // Verificar se loja está ativa
        if (usuario.loja_status !== 'ativa') {
            return res.status(403).json({ erro: 'Loja suspensa ou cancelada' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Gerar token
        const token = generateToken({
            id: usuario.id,
            email: usuario.email,
            loja_id: usuario.loja_id,
            role: usuario.role,
            tipo: 'admin'
        });

        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role
            },
            loja: {
                id: usuario.loja_id,
                nome: usuario.loja_nome,
                slug: usuario.loja_slug
            }
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};

// ============================================
// OBTER DADOS DO USUÁRIO LOGADO
// ============================================
const getMe = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.id, u.nome, u.email, u.cpf_cnpj, u.telefone, u.role, u.loja_id,
                    l.nome_exibicao as loja_nome, l.slug as loja_slug
             FROM usuarios u
             INNER JOIN lojas l ON u.loja_id = l.id
             WHERE u.id = $1 AND u.loja_id = $2`,
            [req.usuario.id, req.usuario.loja_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuario nao encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar dados do usuario:', error);
        res.status(500).json({ erro: 'Erro ao buscar dados' });
    }
};

// ============================================
// BUSCAR LOJA POR NOME OU SLUG
// ============================================
const buscarLoja = async (req, res) => {
    try {
        const { termo } = req.query;

        if (!termo || termo.trim() === '') {
            return res.status(400).json({ erro: 'Informe o nome ou slug da loja' });
        }

        const termoLike = `%${termo.toLowerCase()}%`;

        const result = await db.query(
            `SELECT id, nome_exibicao, slug, telefone, whatsapp, logo, cor_primaria, cor_secundaria
             FROM lojas
             WHERE (LOWER(nome_exibicao) LIKE $1 OR LOWER(slug) LIKE $1)
             AND status = 'ativa'
             LIMIT 10`,
            [termoLike]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                erro: 'Nenhuma loja encontrada',
                mensagem: 'Verifique o nome da loja e tente novamente'
            });
        }

        res.json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar loja:', error);
        res.status(500).json({ erro: 'Erro ao buscar loja' });
    }
};

// ============================================
// OBTER DADOS PÚBLICOS DA LOJA POR SLUG
// ============================================
const getLojaPorSlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const result = await db.query(
            `SELECT id, nome_exibicao, slug, telefone, whatsapp, logo, 
                    cor_primaria, cor_secundaria
             FROM lojas
             WHERE slug = $1 AND status = 'ativa'`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Loja nao encontrada' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar loja:', error);
        res.status(500).json({ erro: 'Erro ao buscar loja' });
    }
};

// ============================================
// CADASTRO DE CLIENTE (NO SITE DA LOJA)
// ============================================
const registerCliente = async (req, res) => {
    try {
        const { slug, nome, email, senha, cpf_cnpj, telefone, endereco, cidade, estado, cep } = req.body;

        // Validar campos obrigatórios
        const camposFaltando = validarCamposObrigatorios(
            ['slug', 'nome', 'email', 'senha', 'cpf_cnpj', 'telefone'],
            req.body
        );

        if (camposFaltando.length > 0) {
            return res.status(400).json({
                erro: 'Campos obrigatorios faltando',
                campos: camposFaltando
            });
        }

        // Validar email
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'Email invalido' });
        }

        // Validar CPF/CNPJ
        if (!validarCpfCnpj(cpf_cnpj)) {
            return res.status(400).json({ erro: 'CPF/CNPJ invalido' });
        }

        // Validar senha
        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter no minimo 6 caracteres' });
        }

        // Buscar loja pelo slug
        const lojaResult = await db.query(
            'SELECT id, nome_exibicao, status FROM lojas WHERE slug = $1',
            [slug]
        );

        if (lojaResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Loja nao encontrada' });
        }

        const loja = lojaResult.rows[0];

        if (loja.status !== 'ativa') {
            return res.status(403).json({ erro: 'Loja nao esta ativa' });
        }

        // Verificar se email já existe NESTA loja
        const emailExiste = await db.query(
            'SELECT id FROM clientes WHERE email = $1 AND loja_id = $2',
            [email, loja.id]
        );

        if (emailExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'Email ja cadastrado nesta loja' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Criar cliente
        const result = await db.query(
            `INSERT INTO clientes (loja_id, nome, email, senha, cpf_cnpj, telefone, endereco, cidade, estado, cep, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ativo')
             RETURNING id, nome, email, loja_id, telefone, cidade, estado`,
            [loja.id, nome, email, senhaHash, cpf_cnpj, telefone, endereco || null, cidade || null, estado || null, cep || null]
        );

        const cliente = result.rows[0];

        // Gerar token
        const token = generateToken({
            id: cliente.id,
            email: cliente.email,
            loja_id: cliente.loja_id,
            tipo: 'cliente'
        });

        res.status(201).json({
            mensagem: 'Cliente cadastrado com sucesso',
            token,
            cliente: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone
            },
            loja: {
                id: loja.id,
                nome: loja.nome_exibicao,
                slug: slug
            }
        });

    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
    }
};

// ============================================
// LOGIN DE CLIENTE
// ============================================
const loginCliente = async (req, res) => {
    try {
        const { slug, email, senha } = req.body;

        // Validar campos obrigatórios
        if (!slug || !email || !senha) {
            return res.status(400).json({ erro: 'Slug, email e senha sao obrigatorios' });
        }

        // Validar email
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'Email invalido' });
        }

        // Buscar loja pelo slug
        const lojaResult = await db.query(
            'SELECT id, nome_exibicao, slug, status FROM lojas WHERE slug = $1',
            [slug]
        );

        if (lojaResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Loja nao encontrada' });
        }

        const loja = lojaResult.rows[0];

        if (loja.status !== 'ativa') {
            return res.status(403).json({ erro: 'Loja nao esta ativa' });
        }

        // Buscar cliente
        const result = await db.query(
            `SELECT id, nome, email, senha, loja_id, telefone, status
             FROM clientes
             WHERE email = $1 AND loja_id = $2`,
            [email, loja.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const cliente = result.rows[0];

        // Verificar se cliente está ativo
        if (cliente.status !== 'ativo') {
            return res.status(403).json({ erro: 'Cliente desativado' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, cliente.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Gerar token
        const token = generateToken({
            id: cliente.id,
            email: cliente.email,
            loja_id: cliente.loja_id,
            tipo: 'cliente'
        });

        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            cliente: {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                telefone: cliente.telefone
            },
            loja: {
                id: loja.id,
                nome: loja.nome_exibicao,
                slug: loja.slug
            }
        });

    } catch (error) {
        console.error('Erro ao fazer login de cliente:', error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
};
module.exports = {
    registerAdmin,
    loginAdmin,
    getMe,
    buscarLoja,
    getLojaPorSlug,
    registerCliente,
    loginCliente
};