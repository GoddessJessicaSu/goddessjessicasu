import pino from 'pino';
import { config } from './config';

const logger = pino({
  level: config.logLevel,
  ...(config.isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});

export function createServiceLogger(name: string) {
  return logger.child({ service: name });
}

export default logger;
