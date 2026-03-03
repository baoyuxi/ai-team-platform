import { WebSocketServer } from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import type { WSMessage } from '@ai-team/shared';
import { getMessageBus } from '../orchestrator/MessageBus';

/**
 * WebSocket 服务器
 */
export class WebSocketService {
  private connections: Set<any>;
  private messageBus;

  constructor() {
    this.connections = new Set();
    this.messageBus = getMessageBus();
  }

  /**
   * 注册 WebSocket 路由
   */
  register(fastify: FastifyInstance): void {
    fastify.register(async (fastify) => {
      const wsServer = fastify.websocketServer;
      const self = this;

      wsServer.on('connection', (socket: any, request: any) => {
        console.log('WebSocket client connected');

        // 添加到连接集合
        self.connections.add(socket);

        // 发送欢迎消息
        self.sendToClient(socket, {
          type: 'connected',
          data: { message: 'Connected to AI Team Platform' },
        });

        // 处理客户端消息
        socket.on('message', async (data: string) => {
          try {
            const message = JSON.parse(data.toString());
            await self.handleClientMessage(socket, message);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            self.sendToClient(socket, {
              type: 'error',
              data: { error: 'Invalid message format' },
            });
          }
        });

        // 处理断开连接
        socket.on('close', () => {
          console.log('WebSocket client disconnected');
          self.connections.delete(socket);
        });

        // 处理错误
        socket.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      });

      // 订阅消息总线事件
      self.subscribeToEvents();
    });
  }

  /**
   * 处理客户端消息
   */
  private async handleClientMessage(socket: any, message: any): Promise<void> {
    const { type, data } = message;

    switch (type) {
      case 'subscribe':
        // 客户端订阅频道
        socket.channels = socket.channels || new Set();
        if (data.channel) {
          socket.channels.add(data.channel);
        }
        break;

      case 'unsubscribe':
        // 客户端取消订阅
        if (socket.channels && data.channel) {
          socket.channels.delete(data.channel);
        }
        break;

      case 'send_message':
        // 客户端发送消息到 Agent
        try {
          const orchestrator = (await import('../orchestrator/Orchestrator')).getOrchestrator();
          // TODO: 实现发送消息到 Agent
        } catch (error) {
          this.sendToClient(socket, {
            type: 'error',
            data: { error: error instanceof Error ? error.message : String(error) },
          });
        }
        break;

      case 'execute_task':
        // 客户端请求执行任务
        try {
          const orchestrator = (await import('../orchestrator/Orchestrator')).getOrchestrator();
          // TODO: 实现任务执行
        } catch (error) {
          this.sendToClient(socket, {
            type: 'error',
            data: { error: error instanceof Error ? error.message : String(error) },
          });
        }
        break;

      default:
        this.sendToClient(socket, {
          type: 'error',
          data: { error: `Unknown message type: ${type}` },
        });
    }
  }

  /**
   * 订阅消息总线事件
   */
  private subscribeToEvents(): void {
    // 订阅消息事件
    this.messageBus.on('message', (message) => {
      this.broadcast({
        type: 'message',
        data: message,
      });
    });

    // 订阅 Agent 状态变化
    this.messageBus.on('agent:status', ({ agentId, status }) => {
      this.broadcast({
        type: 'agent_status',
        data: { agentId, status },
      });
    });

    // 订阅任务进度
    this.messageBus.on('task:progress', ({ taskId, progress }) => {
      this.broadcast({
        type: 'task_progress',
        data: { taskId, progress },
      });
    });
  }

  /**
   * 发送消息到客户端
   */
  private sendToClient(socket: any, message: WSMessage): void {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  }

  /**
   * 广播消息到所有连接的客户端
   */
  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const connection of this.connections) {
      if (connection.readyState === 1) {
        connection.send(data);
      }
    }
  }

  /**
   * 发送消息到特定频道
   */
  sendToChannel(channel: string, message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const connection of this.connections) {
      if (connection.readyState === 1 && connection.channels?.has(channel)) {
        connection.send(data);
      }
    }
  }

  /**
   * 获取连接数
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

// 单例实例
let wsServiceInstance: WebSocketService | null = null;

/**
 * 获取 WebSocket 服务单例
 */
export function getWebSocketService(): WebSocketService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService();
  }
  return wsServiceInstance;
}
