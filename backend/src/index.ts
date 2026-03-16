import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import logger from './logger';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './routes/auth.routes';
import { depositRoutes } from './routes/deposit.routes';
import { purchaseRoutes } from './routes/purchase.routes';
import { adminRoutes } from './routes/admin.routes';
import { galleryRoutes } from './routes/gallery.routes';
import { startCryptoListener, stopCryptoListener } from './services/crypto-listener.service';
import { ensureBuckets } from './services/minio.service';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

ensureBuckets()
  .then(() => {
    const server = app.listen(config.port, () => {
      logger.info({ port: config.port }, 'Backend running');
      startCryptoListener();
    });

    function shutdown() {
      logger.info('Shutting down...');
      stopCryptoListener();
      server.close(() => process.exit(0));
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to ensure MinIO buckets');
    process.exit(1);
  });
