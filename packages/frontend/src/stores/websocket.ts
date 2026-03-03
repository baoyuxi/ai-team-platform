import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getWSClient, type WSClient } from '@/services/api';
import type { AgentMessage, WSMessage } from '@ai-team/shared';

export const useWebSocketStore = defineStore('websocket', () => {
  // 状态
  const connected = ref(false);
  const connecting = ref(false);
  const messages = ref<AgentMessage[]>([]);
  const agentStatuses = ref<Map<string, string>>(new Map());
  const taskProgress = ref<Map<string, number>>(new Map());

  // 客户端
  let wsClient: WSClient | null = null;

  // 计算属性
  const connectionStatus = computed(() => {
    if (connected.value) return '已连接';
    if (connecting.value) return '连接中...';
    return '未连接';
  });

  /**
   * 连接
   */
  function connect() {
    if (wsClient) {
      return; // 已经连接
    }

    connecting.value = true;

    wsClient = getWSClient();

    // 注册事件监听
    wsClient.on('connected', () => {
      connected.value = true;
      connecting.value = false;
    });

    wsClient.on('disconnected', () => {
      connected.value = false;
      connecting.value = false;
    });

    wsClient.on('error', (data: any) => {
      console.error('WebSocket error:', data);
      connecting.value = false;
    });

    wsClient.on('message', (data: any) => {
      messages.value.push(data);
      // 限制消息数量
      if (messages.value.length > 1000) {
        messages.value = messages.value.slice(-1000);
      }
    });

    wsClient.on('agent_status', (data: any) => {
      agentStatuses.value.set(data.agentId, data.status);
    });

    wsClient.on('task_progress', (data: any) => {
      taskProgress.value.set(data.taskId, data.progress);
    });

    // 连接
    wsClient.connect();
  }

  /**
   * 断开连接
   */
  function disconnect() {
    if (wsClient) {
      wsClient.disconnect();
      wsClient = null;
      connected.value = false;
    }
  }

  /**
   * 发送消息
   */
  function sendMessage(type: string, data: any) {
    if (!wsClient) {
      console.warn('WebSocket not connected');
      return;
    }
    wsClient.send({ type, data });
  }

  /**
   * 发送消息到 Agent
   */
  function sendToAgent(to: string, content: any) {
    if (!wsClient) {
      console.warn('WebSocket not connected');
      return;
    }
    wsClient.sendMessage(to, content);
  }

  /**
   * 请求执行任务
   */
  function executeTask(agent: string, task: any) {
    if (!wsClient) {
      console.warn('WebSocket not connected');
      return;
    }
    wsClient.executeTask(agent, task);
  }

  /**
   * 订阅频道
   */
  function subscribe(channel: string) {
    if (!wsClient) {
      console.warn('WebSocket not connected');
      return;
    }
    wsClient.subscribe(channel);
  }

  /**
   * 取消订阅频道
   */
  function unsubscribe(channel: string) {
    if (!wsClient) {
      console.warn('WebSocket not connected');
      return;
    }
    wsClient.unsubscribe(channel);
  }

  /**
   * 清空消息
   */
  function clearMessages() {
    messages.value = [];
  }

  /**
   * 获取 Agent 状态
   */
  function getAgentStatus(agentId: string): string | undefined {
    return agentStatuses.value.get(agentId);
  }

  /**
   * 获取任务进度
   */
  function getTaskProgress(taskId: string): number | undefined {
    return taskProgress.value.get(taskId);
  }

  /**
   * 重置状态
   */
  function reset() {
    disconnect();
    messages.value = [];
    agentStatuses.value.clear();
    taskProgress.value.clear();
  }

  return {
    // 状态
    connected,
    connecting,
    messages,
    agentStatuses,
    taskProgress,

    // 计算属性
    connectionStatus,

    // 方法
    connect,
    disconnect,
    sendMessage,
    sendToAgent,
    executeTask,
    subscribe,
    unsubscribe,
    clearMessages,
    getAgentStatus,
    getTaskProgress,
    reset,
  };
});
