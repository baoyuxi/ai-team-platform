import { v4 as uuidv4 } from 'uuid';
import type { AgentTask, AgentContext, ProjectConfig, AgentRole } from '@ai-team/shared';
import { getMessageBus } from './MessageBus';
import { WORKFLOW_STAGES } from '@ai-team/shared';
import type BaseAgent from '../agents/base/Agent';

/**
 * 编排器 - 管理 Agent 协作的核心
 */
export class AgentOrchestrator {
  private messageBus;
  private agents: Map<string, BaseAgent>;
  private currentProject: ProjectConfig | null;
  private workflow: AgentTask[];
  private context: AgentContext | null;

  constructor() {
    this.messageBus = getMessageBus();
    this.agents = new Map();
    this.currentProject = null;
    this.workflow = [];
    this.context = null;
  }

  /**
   * 注册 Agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getId(), agent);
    console.log(`Agent registered: ${agent.getConfig().name} (${agent.getId()})`);
  }

  /**
   * 注销 Agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  /**
   * 获取 Agent
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 根据 Agent 角色获取 Agent
   */
  getAgentByRole(role: AgentRole): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.getConfig().role === role) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * 获取所有 Agent
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 创建项目
   */
  async createProject(requirement: string, options: {
    name?: string;
    description?: string;
    techStack?: any;
  } = {}): Promise<ProjectConfig> {
    const projectId = uuidv4();

    const project: ProjectConfig = {
      id: projectId,
      name: options.name || '未命名项目',
      description: options.description,
      requirement,
      techStack: options.techStack,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.currentProject = project;

    // 初始化上下文
    this.context = {
      projectId: project.id,
      projectName: project.name,
      requirement: project.requirement,
    };

    // 广播项目创建事件
    await this.messageBus.broadcast({
      id: uuidv4(),
      from: 'orchestrator',
      content: { type: 'project_created', project },
      timestamp: Date.now(),
    });

    return project;
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(requirement: string, options: any = {}): Promise<void> {
    // 创建项目
    const project = await this.createProject(requirement, options);

    // 执行各阶段任务
    for (const stage of WORKFLOW_STAGES) {
      const agent = this.getAgentByRole(stage.agent as AgentRole);
      if (!agent) {
        console.warn(`Agent not found for role: ${stage.agent}`);
        continue;
      }

      console.log(`Executing stage: ${stage.name} with agent: ${agent.getConfig().name}`);

      // 创建任务
      const task: AgentTask = {
        id: uuidv4(),
        type: stage.id,
        input: {
          requirement,
          stage: stage.id,
        },
        status: 'pending',
      };

      // 更新上下文
      if (this.context) {
        this.context.currentStage = stage.id;
      }

      try {
        // 执行任务
        const result = await agent.execute(task, this.context!);

        // 更新任务状态
        task.status = 'completed';
        task.output = result.data;

        // 更新上下文
        this.updateContext(stage.id, result.data);

        // 广播任务完成
        await this.messageBus.publish({
          id: uuidv4(),
          from: agent.getId(),
          to: '*',
          type: 'notification',
          content: {
            type: 'task_completed',
            stage: stage.id,
            result: result.data,
          },
          timestamp: Date.now(),
        });

        console.log(`Stage completed: ${stage.name}`);
      } catch (error) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : String(error);

        console.error(`Stage failed: ${stage.name}`, error);

        // 广播任务失败
        await this.messageBus.publish({
          id: uuidv4(),
          from: agent.getId(),
          to: '*',
          type: 'notification',
          content: {
            type: 'task_failed',
            stage: stage.id,
            error: task.error,
          },
          timestamp: Date.now(),
        });

        // 是否继续执行？这里选择继续
      }
    }

    console.log('Workflow completed');
  }

  /**
   * Agent 间通信
   */
  async sendMessage(from: string, to: string, content: any): Promise<any> {
    const fromAgent = this.getAgent(from);
    const toAgent = this.getAgent(to);

    if (!fromAgent || !toAgent) {
      throw new Error(`Agent not found: from=${from}, to=${to}`);
    }

    const message = {
      id: uuidv4(),
      from,
      to,
      type: 'request' as const,
      content,
      timestamp: Date.now(),
    };

    // 发送消息
    const response = await toAgent.handleMessage(message);

    // 发布到消息总线
    await this.messageBus.publish(message);

    return response;
  }

  /**
   * 并行执行多个任务
   */
  async parallelExecute(tasks: Array<{
    agent: string;
    task: Omit<AgentTask, 'id' | 'status'>;
  }>): Promise<void> {
    await Promise.all(
      tasks.map(async ({ agent, task }) => {
        const agentInstance = this.getAgent(agent);
        if (!agentInstance) {
          console.warn(`Agent not found: ${agent}`);
          return;
        }

        const fullTask: AgentTask = {
          id: uuidv4(),
          ...task,
          status: 'running',
          startedAt: Date.now(),
        };

        try {
          const result = await agentInstance.execute(fullTask, this.context!);
          fullTask.status = 'completed';
          fullTask.output = result.data;
          fullTask.completedAt = Date.now();
        } catch (error) {
          fullTask.status = 'failed';
          fullTask.error = error instanceof Error ? error.message : String(error);
        }
      })
    );
  }

  /**
   * 更新上下文
   */
  private updateContext(stage: string, data: any): void {
    if (!this.context) return;

    switch (stage) {
      case 'requirement':
        this.context.prd = data;
        break;
      case 'design':
        this.context.design = data;
        break;
      case 'architecture':
        this.context.architecture = data;
        break;
      case 'frontend':
      case 'backend':
        if (!this.context.files) {
          this.context.files = new Map();
        }
        if (data.files) {
          Object.entries(data.files).forEach(([path, content]) => {
            this.context.files!.set(path, content as string);
          });
        }
        break;
    }
  }

  /**
   * 获取当前项目
   */
  getCurrentProject(): ProjectConfig | null {
    return this.currentProject;
  }

  /**
   * 获取当前上下文
   */
  getContext(): AgentContext | null {
    return this.context;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.currentProject = null;
    this.context = null;
    this.workflow = [];
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.reset();
    this.agents.clear();
  }
}

// 单例实例
let orchestratorInstance: AgentOrchestrator | null = null;

/**
 * 获取编排器单例
 */
export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * 重置编排器（用于测试）
 */
export function resetOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.destroy();
  }
  orchestratorInstance = null;
}
