import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import logger from '../logger';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customAttributeKeys: { responseTime: 'responseTime' },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ...(req.raw?.user && { userId: (req.raw as any).user.id }),
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});
