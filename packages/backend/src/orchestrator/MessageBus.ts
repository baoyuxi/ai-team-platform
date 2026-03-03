import mitt, { Emitter } from 'mitt';
import { v4 as uuidv4 } from 'uuid';
import type { AgentMessage } from '@ai-team/shared';

/**
 * 消息总线事件类型
 */
type MessageBusEvents = {
  message: AgentMessage;
  'message:sent': AgentMessage;
  'message:received': AgentMessage;
  'agent:status': { agentId: string; status: string };
  'task:progress': { taskId: string; progress: number };
};

/**
 * 消息总线 - Agent 间通信核心
 */
export class MessageBus {
  private emitter: Emitter<MessageBusEvents>;
  private messageHistory: AgentMessage[];
  private subscribers: Map<string, Set<(message: AgentMessage) => void>>;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.emitter = mitt<MessageBusEvents>();
    this.messageHistory = [];
    this.subscribers = new Map();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * 发布消息
   */
  async publish(message: AgentMessage): Promise<void> {
    // 确保消息有 ID
    if (!message.id) {
      message.id = uuidv4();
    }

    // 确保消息有时间戳
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    // 记录到历史
    this.addToHistory(message);

    // 触发事件
    this.emitter.emit('message', message);
    this.emitter.emit('message:sent', message);

    // 通知订阅者
    const handlers = this.subscribers.get(message.to);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${message.to}:`, error);
        }
      }
    }

    // 通知所有订阅 'all' 的监听者
    const allHandlers = this.subscribers.get('*');
    if (allHandlers) {
      for (const handler of allHandlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error('Error in "all" message handler:', error);
        }
      }
    }
  }

  /**
   * 订阅消息
   */
  subscribe(
    agentId: string,
    handler: (message: AgentMessage) => void | Promise<void>
  ): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }
    this.subscribers.get(agentId)!.add(handler);

    // 返回取消订阅函数
    return () => this.unsubscribe(agentId, handler);
  }

  /**
   * 取消订阅
   */
  private unsubscribe(
    agentId: string,
    handler: (message: AgentMessage) => void
  ): void {
    const handlers = this.subscribers.get(agentId);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(agentId);
      }
    }
  }

  /**
   * 广播消息（所有 Agent）
   */
  async broadcast(message: Omit<AgentMessage, 'to'>): Promise<void> {
    const broadcastMessage: AgentMessage = {
      ...message,
      to: '*',
      type: message.type || 'broadcast',
    };

    await this.publish(broadcastMessage);
  }

  /**
   * 获取消息历史
   */
  getHistory(
    filter?: {
      from?: string;
      to?: string;
      since?: number;
      limit?: number;
    }
  ): AgentMessage[] {
    let history = [...this.messageHistory];

    // 过滤发送者
    if (filter?.from) {
      history = history.filter((m) => m.from === filter.from);
    }

    // 过滤接收者
    if (filter?.to) {
      history = history.filter((m) => m.to === filter.to);
    }

    // 过滤时间
    if (filter?.since) {
      history = history.filter((m) => m.timestamp >= filter.since);
    }

    // 限制数量
    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * 清空消息历史
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message);

    // 限制历史记录大小
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 监听事件
   */
  on<K extends keyof MessageBusEvents>(
    event: K,
    handler: (data: MessageBusEvents[K]) => void
  ): () => void {
    this.emitter.on(event, handler);
    return () => this.emitter.off(event, handler);
  }

  /**
   * 清理
   */
  destroy(): void {
    this.emitter.all.clear();
    this.subscribers.clear();
    this.messageHistory = [];
  }
}

// 单例实例
let messageBusInstance: MessageBus | null = null;

/**
 * 获取消息总线单例
 */
export function getMessageBus(): MessageBus {
  if (!messageBusInstance) {
    messageBusInstance = new MessageBus();
  }
  return messageBusInstance;
}

/**
 * 重置消息总线（用于测试）
 */
export function resetMessageBus(): void {
  if (messageBusInstance) {
    messageBusInstance.destroy();
  }
  messageBusInstance = null;
}
