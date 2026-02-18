import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/env';
import { logger } from './utils/logger';
import webhookRouter from './webhooks/uazapi';
import { templateService } from './services/supabase';
import { uazapiService } from './services/uazapi';

// Validar configuracao antes de iniciar
validateConfig();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log de requisicoes
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/api', webhookRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Admin: Limpar cache de templates ──
// Chamado pela API principal quando admin edita um template
app.post('/api/admin/clear-template-cache', (req, res) => {
  try {
    const authHeader = req.headers['x-internal-key'];
    if (authHeader !== config.internalKey) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    templateService.clearCache();
    logger.info('Cache de templates limpo via admin');
    res.json({ success: true, message: 'Cache de templates limpo' });
  } catch (error) {
    logger.error('Erro ao limpar cache', error);
    res.status(500).json({ error: 'Erro ao limpar cache' });
  }
});

// ── Admin: Status detalhado do WhatsApp ──
app.get('/api/admin/whatsapp-status', async (req, res) => {
  try {
    const authHeader = req.headers['x-internal-key'];
    if (authHeader !== config.internalKey) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const instanceStatus = await uazapiService.getInstanceStatus();
    res.json({
      service: 'running',
      database: 'postgresql',
      uazapi: instanceStatus || { connected: false },
      cache_entries: templateService.getCacheSize(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ service: 'running', uazapi: { connected: false }, error: 'Falha ao obter status' });
  }
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'PixZen WhatsApp AI',
    version: '2.1.0',
    status: 'running',
    database: 'postgresql',
    endpoints: {
      webhook: '/api/webhook',
      health: '/api/health',
      link: '/api/link',
      clearCache: '/api/admin/clear-template-cache',
      whatsappStatus: '/api/admin/whatsapp-status'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro nao tratado', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
app.listen(config.port, () => {
  logger.info(`PixZen WhatsApp AI v2.1 rodando na porta ${config.port}`);
  logger.info(`Webhook URL: http://localhost:${config.port}/api/webhook`);
  logger.info(`Database: PostgreSQL direto (sem Supabase)`);
  logger.info(`Ambiente: ${config.nodeEnv}`);
});

export default app;
