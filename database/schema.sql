-- ============================================
-- SISTEMA ERP MULTI-TENANT
-- Script de criação do banco de dados
-- ============================================

-- Criar banco de dados (execute este comando separadamente se necessário)
-- CREATE DATABASE erp_multitenant;

-- Conectar ao banco
-- \c erp_multitenant;

-- ============================================
-- TABELA: lojas
-- Armazena informações de cada loja (tenant)
-- ============================================

CREATE TABLE IF NOT EXISTS lojas (
    id SERIAL PRIMARY KEY,
    nome_exibicao VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    logo TEXT,
    cor_primaria VARCHAR(7) DEFAULT '#3B82F6',
    cor_secundaria VARCHAR(7) DEFAULT '#1E40AF',
    status VARCHAR(20) DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentários explicativos
COMMENT ON TABLE lojas IS 'Tabela principal de lojas do sistema multi-tenant';
COMMENT ON COLUMN lojas.slug IS 'URL amigavel para acesso ao site publico da loja';
COMMENT ON COLUMN lojas.whatsapp IS 'Numero do WhatsApp para botao flutuante no site';
COMMENT ON COLUMN lojas.status IS 'Status da loja: ativa, suspensa ou cancelada';

-- ============================================
-- TABELA: usuarios
-- Armazena administradores de cada loja
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(18) NOT NULL,
    telefone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(email, loja_id)
);

-- Comentários explicativos
COMMENT ON TABLE usuarios IS 'Administradores das lojas';
COMMENT ON COLUMN usuarios.loja_id IS 'Vinculo com a loja (multi-tenant)';
COMMENT ON COLUMN usuarios.senha IS 'Hash bcrypt da senha';
COMMENT ON COLUMN usuarios.role IS 'Papel do usuario: admin ou super_admin';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_loja ON usuarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_lojas_slug ON lojas(slug);
CREATE INDEX IF NOT EXISTS idx_lojas_status ON lojas(status);

-- ============================================
-- FUNÇÃO: Atualizar campo updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Atualizar updated_at
-- ============================================

CREATE TRIGGER set_timestamp_lojas
BEFORE UPDATE ON lojas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Tabelas LOJAS e USUARIOS criadas com sucesso!';
END $$;
-- ============================================
-- TABELA: clientes
-- Clientes que se cadastram no site da loja
-- ============================================

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(18) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(email, loja_id)
);

CREATE INDEX IF NOT EXISTS idx_clientes_loja ON clientes(loja_id);

-- Trigger para updated_at em clientes
CREATE TRIGGER set_timestamp_clientes
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- TABELA: categorias
-- Categorias de produtos
-- ============================================

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorias_loja ON categorias(loja_id);

-- Trigger para updated_at em categorias
CREATE TRIGGER set_timestamp_categorias
BEFORE UPDATE ON categorias
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- TABELA: produtos
-- Catálogo de produtos
-- ============================================

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    codigo_sku VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_venda DECIMAL(10,2) NOT NULL,
    preco_custo DECIMAL(10,2),
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    imagem TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(codigo_sku, loja_id)
);

CREATE INDEX IF NOT EXISTS idx_produtos_loja ON produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(codigo_sku);

-- Trigger para updated_at em produtos
CREATE TRIGGER set_timestamp_produtos
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DO $$
BEGIN
    RAISE NOTICE 'Tabelas CLIENTES, CATEGORIAS e PRODUTOS criadas!';
END $$;
-- ============================================
-- TABELA: vendas
-- Registro de vendas realizadas
-- ============================================

CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    numero_venda VARCHAR(50) NOT NULL,
    data_venda TIMESTAMP DEFAULT NOW(),
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(numero_venda, loja_id)
);

CREATE INDEX IF NOT EXISTS idx_vendas_loja ON vendas(loja_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);

CREATE TRIGGER set_timestamp_vendas
BEFORE UPDATE ON vendas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- TABELA: vendas_itens
-- Itens de cada venda
-- ============================================

CREATE TABLE IF NOT EXISTS vendas_itens (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendas_itens_venda ON vendas_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_itens_produto ON vendas_itens(produto_id);

-- ============================================
-- TABELA: orcamentos
-- Orcamentos solicitados pelos clientes
-- ============================================

CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    numero_orcamento VARCHAR(50) NOT NULL,
    data_orcamento TIMESTAMP DEFAULT NOW(),
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    origem VARCHAR(20) DEFAULT 'site',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(numero_orcamento, loja_id)
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_loja ON orcamentos(loja_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);

CREATE TRIGGER set_timestamp_orcamentos
BEFORE UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- TABELA: orcamentos_itens
-- Itens de cada orcamento
-- ============================================

CREATE TABLE IF NOT EXISTS orcamentos_itens (
    id SERIAL PRIMARY KEY,
    orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_orcamento ON orcamentos_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_itens_produto ON orcamentos_itens(produto_id);

DO $$
BEGIN
    RAISE NOTICE 'Tabelas VENDAS e ORCAMENTOS criadas!';
END $$;
-- ============================================
-- TABELA: contas_a_pagar
-- Controle de despesas e contas
-- ============================================

CREATE TABLE IF NOT EXISTS contas_a_pagar (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    categoria VARCHAR(100),
    status VARCHAR(20) DEFAULT 'a_vencer',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_loja ON contas_a_pagar(loja_id);
CREATE INDEX IF NOT EXISTS idx_contas_vencimento ON contas_a_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_status ON contas_a_pagar(status);

CREATE TRIGGER set_timestamp_contas
BEFORE UPDATE ON contas_a_pagar
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- TABELA: notas_fiscais
-- Notas fiscais de entrada e saida
-- ============================================

CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    numero_nfe VARCHAR(100) NOT NULL,
    serie VARCHAR(10),
    data_emissao DATE NOT NULL,
    cliente_fornecedor VARCHAR(255),
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    observacoes TEXT,
    xml_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(numero_nfe, serie, loja_id)
);

CREATE INDEX IF NOT EXISTS idx_nfe_loja ON notas_fiscais(loja_id);
CREATE INDEX IF NOT EXISTS idx_nfe_tipo ON notas_fiscais(tipo);
CREATE INDEX IF NOT EXISTS idx_nfe_data ON notas_fiscais(data_emissao);

-- ============================================
-- TABELA: notas_fiscais_itens
-- Itens de cada nota fiscal
-- ============================================

CREATE TABLE IF NOT EXISTS notas_fiscais_itens (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nfe_itens_nota ON notas_fiscais_itens(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_nfe_itens_produto ON notas_fiscais_itens(produto_id);

-- ============================================
-- TABELA: ajustes_estoque
-- Historico de ajustes de estoque
-- ============================================

CREATE TABLE IF NOT EXISTS ajustes_estoque (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    estoque_anterior INTEGER NOT NULL,
    estoque_novo INTEGER NOT NULL,
    data_ajuste TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ajustes_loja ON ajustes_estoque(loja_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_produto ON ajustes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_data ON ajustes_estoque(data_ajuste);

DO $$
BEGIN
    RAISE NOTICE 'Tabelas FINANCEIRO e NF-e criadas!';
END $$;