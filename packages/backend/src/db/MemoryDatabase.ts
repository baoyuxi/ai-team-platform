import { v4 as uuidv4 } from 'uuid';
import type { IDatabase, ProjectData } from './types';
import type { ProjectConfig, AgentMessage } from '@ai-team/shared';

/**
 * 内存数据库实现
 */
export class MemoryDatabase implements IDatabase {
  private projects: Map<string, ProjectData>;
  private messages: Map<string, AgentMessage[]>;
  private initialized: boolean;

  constructor() {
    this.projects = new Map();
    this.messages = new Map();
    this.initialized = false;
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 可以在这里加载持久化数据
    this.initialized = true;
    console.log('Memory database initialized');
  }

  /**
   * 关闭
   */
  async close(): Promise<void> {
    this.projects.clear();
    this.messages.clear();
    this.initialized = false;
    console.log('Memory database closed');
  }

  /**
   * 创建项目
   */
  async createProject(
    data: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectConfig> {
    const project: ProjectData = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.projects.set(project.id, project);
    return project;
  }

  /**
   * 获取项目
   */
  async getProject(id: string): Promise<ProjectConfig | null> {
    return this.projects.get(id) || null;
  }

  /**
   * 列出所有项目
   */
  async listProjects(): Promise<ProjectConfig[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * 更新项目
   */
  async updateProject(
    id: string,
    data: Partial<ProjectConfig>
  ): Promise<ProjectConfig | null> {
    const project = this.projects.get(id);
    if (!project) {
      return null;
    }

    const updated: ProjectData = {
      ...project,
      ...data,
      id,
      updatedAt: Date.now(),
    };

    this.projects.set(id, updated);
    return updated;
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<boolean> {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.messages.delete(id);
    }
    return deleted;
  }

  /**
   * 保存消息
   */
  async saveMessage(message: AgentMessage): Promise<void> {
    // 从消息中提取项目 ID（如果有的话）
    // 这里简化处理，假设消息有 projectId 属性
    const projectId = (message as any).projectId || 'default';

    if (!this.messages.has(projectId)) {
      this.messages.set(projectId, []);
    }

    this.messages.get(projectId)!.push(message);

    // 限制消息数量（每个项目最多 1000 条）
    const messages = this.messages.get(projectId)!;
    if (messages.length > 1000) {
      this.messages.set(projectId, messages.slice(-1000));
    }
  }

  /**
   * 获取项目的消息
   */
  async getMessages(projectId: string, limit: number = 100): Promise<AgentMessage[]> {
    const messages = this.messages.get(projectId) || [];
    return messages.slice(-limit);
  }

  /**
   * 获取指定时间之后的消息
   */
  async getMessagesSince(projectId: string, since: number): Promise<AgentMessage[]> {
    const messages = this.messages.get(projectId) || [];
    return messages.filter((m) => m.timestamp > since);
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.projects.clear();
    this.messages.clear();
  }
}

export default MemoryDatabase;
