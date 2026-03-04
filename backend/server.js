const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configurado corretamente
app.use(cors({
  origin: ['https://erp-frontend-liart-five.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas
const authRoutes = require('./routes/auth.routes');
const produtosRoutes = require('./routes/produtos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const clientesRoutes = require('./routes/clientes.routes');
const vendasRoutes = require('./routes/vendas.routes');
const orcamentosRoutes = require('./routes/orcamentos.routes');
const financeiroRoutes = require('./routes/financeiro.routes');
const nfeRoutes = require('./routes/nfe.routes');
const estoqueRoutes = require('./routes/estoque.routes');
const configuracoesRoutes = require('./routes/configuracoes.routes');
const lojasRoutes = require('./routes/lojas.routes');

// ============================================
// ROTAS PÚBLICAS (devem vir ANTES das protegidas)
// ============================================

// Rotas públicas de loja (produtos e categorias)
app.use('/api', produtosRoutes); // Contém rotas /api/loja/:slug/produtos e /api/loja/:slug/categorias

// Rota de busca de lojas
app.use('/api/lojas', lojasRoutes);

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================
app.use('/api/produtos', produtosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/nfe', nfeRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/configuracoes', configuracoesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
