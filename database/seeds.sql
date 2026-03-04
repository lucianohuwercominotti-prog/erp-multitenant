-- ============================================
-- DADOS DE TESTE (SEEDS)
-- ============================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE;
TRUNCATE TABLE lojas RESTART IDENTITY CASCADE;

-- ============================================
-- INSERIR LOJAS DE TESTE
-- ============================================

INSERT INTO lojas (nome_exibicao, slug, telefone, whatsapp, cor_primaria, cor_secundaria, status) VALUES
('Loja do João', 'loja-do-joao', '11987654321', '5511987654321', '#3B82F6', '#1E40AF', 'ativa'),
('Boutique Maria', 'boutique-maria', '11976543210', '5511976543210', '#EC4899', '#BE185D', 'ativa'),
('TechStore Pro', 'techstore-pro', '11965432109', '5511965432109', '#10B981', '#059669', 'ativa');

-- ============================================
-- INSERIR USUÁRIOS ADMINISTRADORES DE TESTE
-- ============================================

-- Senha para todos os usuários de teste: "senha123"
-- Hash bcrypt: $2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ

INSERT INTO usuarios (loja_id, nome, email, senha, cpf_cnpj, telefone, role, status) VALUES
(1, 'João Silva', 'joao@lojadojoao.com', '$2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ', '123.456.789-00', '11987654321', 'admin', 'ativo'),
(2, 'Maria Santos', 'maria@boutiquemaria.com', '$2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ', '987.654.321-00', '11976543210', 'admin', 'ativo'),
(3, 'Carlos Tech', 'carlos@techstorepro.com', '$2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ', '456.789.123-00', '11965432109', 'admin', 'ativo');

-- ============================================
-- VERIFICAR DADOS INSERIDOS
-- ============================================

SELECT 'LOJAS CADASTRADAS:' AS info;
SELECT id, nome_exibicao, slug, status FROM lojas;

SELECT 'USUARIOS CADASTRADOS:' AS info;
SELECT u.id, u.nome, u.email, l.nome_exibicao as loja, u.role 
FROM usuarios u 
INNER JOIN lojas l ON u.loja_id = l.id;

DO $$
BEGIN
    RAISE NOTICE 'Dados de teste inseridos com sucesso!';
    RAISE NOTICE 'Login de teste: joao@lojadojoao.com / senha123';
END $$;
-- ============================================
-- INSERIR CLIENTES DE TESTE
-- ============================================

INSERT INTO clientes (loja_id, nome, email, senha, cpf_cnpj, telefone, cidade, estado) VALUES
(1, 'Cliente João 1', 'cliente1@email.com', '$2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ', '111.222.333-44', '11999998888', 'São Paulo', 'SP'),
(1, 'Cliente João 2', 'cliente2@email.com', '$2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ', '555.666.777-88', '11977776666', 'Rio de Janeiro', 'RJ'),
(2, 'Cliente Maria 1', 'clientemaria@email.com', '$2b$10$rZ3qJ0YvH5K6YwXxQXqZUeF8lF5xQJXh8xXqZUeF8lF5xQJXh8xXqZ', '999.888.777-66', '21988887777', 'Belo Horizonte', 'MG');

-- ============================================
-- INSERIR CATEGORIAS DE TESTE
-- ============================================

INSERT INTO categorias (loja_id, nome, descricao) VALUES
(1, 'Eletrônicos', 'Gadgets e dispositivos'),
(1, 'Acessórios', 'Cabos, capas e películas'),
(2, 'Roupas', 'Moda feminina'),
(2, 'Sapatos', 'Calçados diversos'),
(3, 'Serviços', 'Manutenção e suporte');

-- ============================================
-- INSERIR PRODUTOS DE TESTE
-- ============================================

-- Produtos da Loja 1 (João)
INSERT INTO produtos (loja_id, categoria_id, nome, codigo_sku, preco_venda, preco_custo, estoque_atual, estoque_minimo) VALUES
(1, 1, 'Smartphone XYZ', 'LOJA1-SMART-001', 1500.00, 800.00, 10, 2),
(1, 1, 'Notebook Pro', 'LOJA1-NOTE-002', 3500.00, 2000.00, 5, 1),
(1, 2, 'Capa Protetora', 'LOJA1-CAPA-003', 50.00, 10.00, 100, 20);

-- Produtos da Loja 2 (Maria)
INSERT INTO produtos (loja_id, categoria_id, nome, codigo_sku, preco_venda, preco_custo, estoque_atual) VALUES
(2, 3, 'Vestido Florido', 'LOJA2-VEST-001', 120.00, 60.00, 15),
(2, 4, 'Sandália Couro', 'LOJA2-SAND-002', 89.90, 40.00, 8);

SELECT 'DADOS ADICIONAIS INSERIDOS!' AS status;
-- ============================================
-- INSERIR VENDAS DE TESTE
-- ============================================

INSERT INTO vendas (loja_id, cliente_id, usuario_id, numero_venda, subtotal, desconto, total, forma_pagamento, status) VALUES
(1, 1, 1, 'V1-202401-00001', 1550.00, 50.00, 1500.00, 'cartao_credito', 'efetivada'),
(1, 2, 1, 'V1-202401-00002', 3500.00, 0.00, 3500.00, 'pix', 'efetivada'),
(1, NULL, 1, 'V1-202401-00003', 100.00, 0.00, 100.00, 'dinheiro', 'pendente');

-- ============================================
-- INSERIR ITENS DAS VENDAS
-- ============================================

INSERT INTO vendas_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
(1, 1, 1, 1500.00, 1500.00),
(1, 3, 1, 50.00, 50.00),
(2, 2, 1, 3500.00, 3500.00),
(3, 3, 2, 50.00, 100.00);

-- ============================================
-- INSERIR ORCAMENTOS DE TESTE
-- ============================================

INSERT INTO orcamentos (loja_id, cliente_id, numero_orcamento, subtotal, desconto, total, status, origem) VALUES
(1, 1, 'ORC1-202401-00001', 5000.00, 0.00, 5000.00, 'pendente', 'site'),
(1, 2, 'ORC1-202401-00002', 150.00, 10.00, 140.00, 'efetivado', 'admin'),
(2, 3, 'ORC2-202401-00001', 209.90, 0.00, 209.90, 'pendente', 'site');

-- ============================================
-- INSERIR ITENS DOS ORCAMENTOS
-- ============================================

INSERT INTO orcamentos_itens (orcamento_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
(1, 1, 2, 1500.00, 3000.00),
(1, 2, 1, 2000.00, 2000.00),
(2, 3, 3, 50.00, 150.00),
(3, 4, 1, 120.00, 120.00),
(3, 5, 1, 89.90, 89.90);

SELECT 'VENDAS E ORCAMENTOS INSERIDOS!' AS status;
-- ============================================
-- INSERIR CONTAS A PAGAR DE TESTE
-- ============================================

INSERT INTO contas_a_pagar (loja_id, descricao, valor, data_vencimento, data_pagamento, categoria, status) VALUES
(1, 'Aluguel Janeiro', 2500.00, '2024-01-10', '2024-01-10', 'aluguel', 'paga'),
(1, 'Fornecedor XYZ', 1500.00, '2024-01-15', NULL, 'fornecedores', 'a_vencer'),
(1, 'Conta de Luz', 350.00, '2024-01-05', NULL, 'outros', 'vencida'),
(1, 'Internet', 150.00, '2024-01-20', NULL, 'outros', 'a_vencer'),
(2, 'Aluguel Janeiro', 1800.00, '2024-01-10', '2024-01-09', 'aluguel', 'paga'),
(2, 'Fornecedor Tecidos', 3200.00, '2024-01-18', NULL, 'fornecedores', 'a_vencer');

-- ============================================
-- INSERIR NOTAS FISCAIS DE TESTE
-- ============================================

INSERT INTO notas_fiscais (loja_id, tipo, numero_nfe, serie, data_emissao, cliente_fornecedor, valor_total) VALUES
(1, 'entrada', '12345', '1', '2024-01-05', 'Distribuidora ABC', 5000.00),
(1, 'entrada', '12346', '1', '2024-01-08', 'Fornecedor Tech', 8500.00),
(1, 'saida', '00001', '1', '2024-01-10', 'Cliente João 1', 1500.00),
(2, 'entrada', '98765', '1', '2024-01-06', 'Fabrica de Tecidos', 4500.00);

-- ============================================
-- INSERIR ITENS DAS NOTAS FISCAIS
-- ============================================

INSERT INTO notas_fiscais_itens (nota_fiscal_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
(1, 1, 5, 800.00, 4000.00),
(1, 3, 20, 50.00, 1000.00),
(2, 2, 3, 2000.00, 6000.00),
(2, 1, 3, 833.33, 2500.00),
(3, 1, 1, 1500.00, 1500.00),
(4, 4, 20, 60.00, 1200.00),
(4, 5, 30, 110.00, 3300.00);

-- ============================================
-- INSERIR AJUSTES DE ESTOQUE DE TESTE
-- ============================================

INSERT INTO ajustes_estoque (loja_id, produto_id, usuario_id, tipo, quantidade, motivo, estoque_anterior, estoque_novo) VALUES
(1, 1, 1, 'entrada', 5, 'Compra de fornecedor', 5, 10),
(1, 3, 1, 'saida', 10, 'Produto danificado', 110, 100),
(1, 2, 1, 'entrada', 2, 'Devolucao de cliente', 3, 5);

SELECT 'FINANCEIRO E NF-e INSERIDOS!' AS status;