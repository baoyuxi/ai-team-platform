/**
 * Agent 角色枚举
 */
export enum AgentRole {
  PRODUCT_MANAGER = 'product_manager',
  UI_DESIGNER = 'ui_designer',
  UX_RESEARCHER = 'ux_researcher',
  PRODUCT_OPERATION = 'product_operation',
  ARCHITECT = 'architect',
  FRONTEND_ENGINEER = 'frontend_engineer',
  BACKEND_ENGINEER = 'backend_engineer',
  DATABASE_ENGINEER = 'database_engineer',
  DEVOPS_ENGINEER = 'devops_engineer',
}

/**
 * Agent 状态
 */
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  WORKING = 'working',
  WAITING = 'waiting',
  DONE = 'done',
  ERROR = 'error',
}

/**
 * Agent 配置接口
 */
export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  tools: string[];
  capabilities: string[];
  metadata?: Record<string, any>;
}

/**
 * Agent 消息接口
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'broadcast';
  content: any;
  context?: Record<string, any>;
  timestamp: number;
}

/**
 * Agent 任务接口
 */
export interface AgentTask {
  id: string;
  type: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

/**
 * Agent 上下文
 */
export interface AgentContext {
  projectId: string;
  projectName: string;
  requirement: string;
  prd?: string;
  design?: any;
  architecture?: any;
  files?: Map<string, string>;
  messages?: AgentMessage[];
}

/**
 * Agent 结果
 */
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 项目配置
 */
export interface ProjectConfig {
  id: string;
  name: string;
  description?: string;
  requirement: string;
  techStack?: TechStack;
  createdAt: number;
  updatedAt: number;
}

/**
 * 技术栈配置
 */
export interface TechStack {
  frontend?: {
    framework: 'vue' | 'react' | 'angular';
    language: 'typescript' | 'javascript';
    ui?: string;
    stateManagement?: string;
  };
  backend?: {
    framework: string;
    language: string;
    database?: string;
  };
  buildTool?: 'vite' | 'webpack' | 'rollup';
}

/**
 * 工具接口
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  execute: (params: any) => Promise<ToolResult>;
}

/**
 * 参数 schema
 */
export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  enum?: any[];
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * WebSocket 消息类型
 */
export type WSMessage =
  | { type: 'agent_status'; agentId: string; status: AgentStatus }
  | { type: 'task_progress'; taskId: string; progress: number }
  | { type: 'message'; message: AgentMessage }
  | { type: 'error'; error: string }
  | { type: 'project_update'; project: ProjectConfig };
