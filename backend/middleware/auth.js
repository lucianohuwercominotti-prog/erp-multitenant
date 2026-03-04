const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ erro: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ erro: 'Token mal formatado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta_aqui');

    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      loja_id: decoded.loja_id,
      tipo: decoded.tipo,
      role: decoded.role
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ erro: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado' });
    }
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ erro: 'Erro interno' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.usuario || req.usuario.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };