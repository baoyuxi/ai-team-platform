import axios from 'axios';
import type { ProjectConfig, AgentMessage, WSMessage } from '@ai-team/shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

/**
 * 项目 API
 */
export const projectApi = {
  /**
   * 获取项目列表
   */
  getList: () => api.get<ProjectConfig[]>('/projects'),

  /**
   * 获取项目详情
   */
  getDetail: (id: string) => api.get<ProjectConfig>(`/projects/${id}`),

  /**
   * 创建项目
   */
  create: (data: {
    name: string;
    description?: string;
    requirement: string;
    techStack?: any;
  }) => api.post<ProjectConfig>('/projects', data),

  /**
   * 更新项目
   */
  update: (id: string, data: Partial<ProjectConfig>) =>
    api.put<ProjectConfig>(`/projects/${id}`, data),

  /**
   * 删除项目
   */
  delete: (id: string) => api.delete(`/projects/${id}`),

  /**
   * 执行工作流
   */
  execute: (id: string, data: { requirement: string; [key: string]: any }) =>
    api.post(`/projects/${id}/execute`, data),
};

/**
 * Agent API
 */
export const agentApi = {
  /**
   * 获取 Agent 列表
   */
  getList: () => api.get('/agents'),

  /**
   * 获取 Agent 详情
   */
  getDetail: (id: string) => api.get(`/agents/${id}`),

  /**
   * 发送消息到 Agent
   */
  sendMessage: (id: string, from: string, content: any) =>
    api.post(`/agents/${id}/message`, { from, content }),

  /**
   * 获取 Agent 消息历史
   */
  getMessages: (id: string, params?: { since?: number; limit?: number }) =>
    api.get<AgentMessage[]>(`/agents/${id}/messages`, { params }),
};

/**
 * WebSocket 客户端
 */
export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<string, Set<(data: any) => void>>;

  constructor(url: string = '/ws') {
    this.url = url;
    this.handlers = new Map();
  }

  /**
   * 连接
   */
  connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}${this.url}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.emit(message.type, message.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});

      // 尝试重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`Reconnecting in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { error });
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * 订阅事件
   */
  on(event: string, handler: (data: any) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      }
    }
  }

  /**
   * 订阅频道
   */
  subscribe(channel: string): void {
    this.send({ type: 'subscribe', data: { channel } });
  }

  /**
   * 取消订阅频道
   */
  unsubscribe(channel: string): void {
    this.send({ type: 'unsubscribe', data: { channel } });
  }

  /**
   * 发送消息到 Agent
   */
  sendMessage(to: string, content: any): void {
    this.send({ type: 'send_message', data: { to, content } });
  }

  /**
   * 请求执行任务
   */
  executeTask(agent: string, task: any): void {
    this.send({ type: 'execute_task', data: { agent, task } });
  }
}

/**
 * WebSocket 客户端单例
 */
let wsClient: WSClient | null = null;

export function getWSClient(): WSClient {
  if (!wsClient) {
    wsClient = new WSClient();
  }
  return wsClient;
}

export default api;
