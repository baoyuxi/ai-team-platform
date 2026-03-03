import type { ProjectConfig, AgentMessage } from '@ai-team/shared';

/**
 * 数据库接口
 */
export interface IDatabase {
  // 初始化
  init(): Promise<void>;

  // 关闭
  close(): Promise<void>;

  // 项目操作
  createProject(project: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectConfig>;
  getProject(id: string): Promise<ProjectConfig | null>;
  listProjects(): Promise<ProjectConfig[]>;
  updateProject(id: string, data: Partial<ProjectConfig>): Promise<ProjectConfig | null>;
  deleteProject(id: string): Promise<boolean>;

  // 消息操作
  saveMessage(message: AgentMessage): Promise<void>;
  getMessages(projectId: string, limit?: number): Promise<AgentMessage[]>;
  getMessagesSince(projectId: string, since: number): Promise<AgentMessage[]>;

  // 清理
  clear(): Promise<void>;
}

/**
 * 项目数据（用于内存存储）
 */
interface ProjectData extends ProjectConfig {
  createdAt: number;
  updatedAt: number;
}
