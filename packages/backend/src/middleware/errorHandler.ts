import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

/**
 * API 错误响应格式
 */
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  timestamp: number;
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 错误处理中间件
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error('Request error', 'ErrorHandler', error);

  // 处理验证错误
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: '请求参数验证失败',
      details: error.validation,
      timestamp: Date.now(),
    } as ApiError);
    return;
  }

  // 处理自定义应用错误
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.message,
      details: error.details,
      timestamp: Date.now(),
    } as ApiError);
    return;
  }

  // 处理其他错误
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: error.message || 'Internal Server Error',
    timestamp: Date.now(),
  } as ApiError);
}

/**
 * 404 处理器
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    timestamp: Date.now(),
  } as ApiError);
}

/**
 * 响应拦截器 - 统一响应格式
 */
export async function responseInterceptor(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: any
) {
  // 已经是错误响应的不处理
  if (reply.statusCode >= 400) {
    return payload;
  }

  // 跳过响应包装，直接返回 payload
  // Fastify 会自动序列化 JSON
  return payload;
}

/**
 * 请求日志中间件
 */
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = Date.now();

  request.log.info(`[${request.method}] ${request.url}`);

  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;
    request.log.info(
      `[${request.method}] ${request.url} - ${reply.statusCode} (${duration}ms)`
    );
  });
}
