import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { getOrchestrator } from './orchestrator/Orchestrator';
import { getWebSocketService } from './websocket/WebSocketServer';
import DatabaseManager from './db';
import {
  errorHandler,
  notFoundHandler,
  responseInterceptor,
  requestLogger,
} from './middleware/errorHandler';
import { logger, setLogLevel } from './utils/logger';

/**
 * 后端服务入口
 */
async function startServer() {
  // 设置日志级别
  const env = process.env.NODE_ENV || 'development';
  setLogLevel(env === 'development' ? 1 : 2);

  logger.info('Starting AI Team Platform...');

  // 初始化数据库
  await DatabaseManager.init('memory');
  const db = DatabaseManager.getDatabase();
  logger.info('Database initialized', 'Database', { type: 'memory' });

  const fastify = Fastify({
    logger: {
      level: env === 'development' ? 'info' : 'warn',
    },
  });

  // 注册 CORS
  await fastify.register(cors, {
    origin: true,
  });

  // 注册 WebSocket
  await fastify.register(websocket);

  // 注册请求日志
  fastify.addHook('onRequest', requestLogger);

  // 注册响应拦截器
  fastify.addHook('onSend', responseInterceptor);

  // 注册错误处理器
  fastify.setErrorHandler(errorHandler);

  // 注册 404 处理器
  fastify.setNotFoundHandler(notFoundHandler);

  // 注册 WebSocket 服务
  const wsService = getWebSocketService();
  wsService.register(fastify);

  // 检查智谱 API Key
  const apiKey = process.env.ZHIPU_API_KEY;
  if (apiKey) {
    logger.info('Zhipu AI API Key configured', 'Config');
  } else {
    logger.warn('ZHIPU_API_KEY not set, Agents will not be available', 'Config');
  }

  // 健康检查
  fastify.get('/health', async () => {
    const orchestrator = getOrchestrator();
    return {
      status: 'ok',
      timestamp: Date.now(),
      llm: 'Zhipu AI (GLM-4)',
      database: 'memory',
      agents: orchestrator.getAllAgents().length,
      wsConnections: wsService.getConnectionCount(),
    };
  });

  // API 路由
  await fastify.register(async function (fastify) {
    // 获取项目列表
    fastify.get('/api/projects', async () => {
      const projects = await db.listProjects();
      logger.debug(`Fetched ${projects.length} projects`, 'Projects');
      return projects;
    });

    // 创建项目
    fastify.post('/api/projects', async (request, reply) => {
      const body = request.body as any;

      logger.info('Creating project', 'Projects', { name: body.name });

      try {
        const project = await db.createProject({
          name: body.name,
          description: body.description,
          requirement: body.requirement,
          techStack: body.techStack,
          status: 'created',
        });

        logger.info(`Project created: ${project.id}`, 'Projects', { id: project.id });
        return project;
      } catch (error) {
        logger.error('Failed to create project', 'Projects', error as Error);
        throw error;
      }
    });

    // 获取项目详情
    fastify.get<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
      const { id } = request.params;
      const project = await db.getProject(id);

      if (!project) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      return project;
    });

    // 更新项目
    fastify.put<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
      const { id } = request.params;
      const body = request.body as any;

      logger.debug(`Updating project: ${id}`, 'Projects');

      try {
        const project = await db.updateProject(id, body);

        if (!project) {
          reply.code(404).send({ error: 'Project not found' });
          return;
        }

        return project;
      } catch (error) {
        logger.error('Failed to update project', 'Projects', error as Error);
        throw error;
      }
    });

    // 删除项目
    fastify.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
      const { id } = request.params;

      logger.info(`Deleting project: ${id}`, 'Projects');

      try {
        const deleted = await db.deleteProject(id);

        if (!deleted) {
          reply.code(404).send({ error: 'Project not found' });
          return;
        }

        logger.info(`Project deleted: ${id}`, 'Projects');
        return { success: true };
      } catch (error) {
        logger.error('Failed to delete project', 'Projects', error as Error);
        throw error;
      }
    });

    // 执行工作流
    fastify.post<{ Params: { id: string } }>('/api/projects/:id/execute', async (request, reply) => {
      const { id } = request.params;
      const body = request.body as any;

      logger.info(`Starting workflow for project: ${id}`, 'Workflow');

      try {
        // 更新项目状态
        await db.updateProject(id, { status: 'running' });

        // TODO: 实现工作流执行
        logger.info('Workflow execution (TODO: implement)', 'Workflow');

        return { status: 'started', projectId: id, message: 'Workflow execution coming soon' };
      } catch (error) {
        logger.error('Failed to start workflow', 'Workflow', error as Error);
        throw error;
      }
    });

    // 获取项目消息
    fastify.get<{ Params: { id: string }; Querystring: { limit?: number } }>('/api/projects/:id/messages', async (request, reply) => {
      const { id } = request.params;
      const { limit } = request.query;

      try {
        const messages = await db.getMessages(id, limit);
        return messages;
      } catch (error) {
        logger.error('Failed to fetch messages', 'Messages', error as Error);
        throw error;
      }
    });

    // 获取 Agent 列表
    fastify.get('/api/agents', async () => {
      const orchestrator = getOrchestrator();
      const agents = orchestrator.getAllAgents();

      return agents.map((agent) => ({
        id: agent.getId(),
        name: agent.getConfig().name,
        role: agent.getConfig().role,
        avatar: agent.getConfig().avatar,
        status: agent.getStatus(),
      }));
    });

    // 发送消息到 Agent
    fastify.post<{ Params: { id: string } }>('/api/agents/:id/message', async (request, reply) => {
      const { id } = request.params;
      const body = request.body as any;

      logger.debug(`Sending message to agent: ${id}`, 'Agents');

      try {
        // TODO: 实现 Agent 消息处理
        logger.info('Agent message handling (TODO: implement)', 'Agents');

        return {
          id: Date.now().toString(),
          from: body.from,
          to: id,
          type: 'response',
          content: `收到消息：${JSON.stringify(body.content)}`,
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error('Failed to send message', 'Agents', error as Error);
        throw error;
      }
    });
  });

  // 启动服务器
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    const host = '0.0.0.0';

    await fastify.listen({ port, host });

    logger.info(`Server started`, 'Server', {
      url: `http://localhost:${port}`,
      env,
      llm: 'Zhipu AI (GLM-4)',
      database: 'memory',
      agents: getOrchestrator().getAllAgents().length,
    });

    console.log('');
    console.log('🚀 AI Team Platform');
    console.log(`📡 Server: http://localhost:${port}`);
    console.log(`🤖 LLM: 智谱 AI (GLM-4)`);
    console.log(`📦 Database: Memory`);
    console.log('');
    console.log('✅ 服务已启动！');
    console.log('💡 提示：Agent 功能开发中，目前可以创建项目和查看界面');
    console.log('');
  } catch (err) {
    logger.error('Failed to start server', 'Server', err as Error);
    process.exit(1);
  }

  // 优雅关闭
  const shutdown = async () => {
    logger.info('Shutting down...', 'Server');
    await DatabaseManager.close();
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// 启动服务
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
