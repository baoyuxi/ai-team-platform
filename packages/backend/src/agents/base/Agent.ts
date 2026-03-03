import { v4 as uuidv4 } from 'uuid';
import type {
  AgentConfig,
  AgentMessage,
  AgentResult,
  AgentStatus,
  AgentTask,
  AgentContext,
  Tool,
} from '@ai-team/shared';
import ZhipuClient from '../../llm/ZhipuClient';

/**
 * Agent 基类
 */
export abstract class BaseAgent {
  protected id: string;
  protected config: AgentConfig;
  protected llmClient: ZhipuClient;
  protected status: AgentStatus;
  protected context?: AgentContext;

  constructor(config: AgentConfig, apiKey: string) {
    this.id = uuidv4();
    this.config = { ...config, id: this.id };
    // 使用智谱 API
    const model = process.env.ZHIPU_MODEL || 'glm-4';
    this.llmClient = new ZhipuClient(apiKey, model);
    this.status = 'idle' as AgentStatus;
  }

  /**
   * 获取 Agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * 获取 Agent 配置
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * 获取 Agent 状态
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * 设置 Agent 状态
   */
  protected setStatus(status: AgentStatus): void {
    this.status = status;
  }

  /**
   * 设置上下文
   */
  setContext(context: AgentContext): void {
    this.context = context;
  }

  /**
   * 执行任务
   */
  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    this.setContext(context);
    this.setStatus('thinking' as AgentStatus);

    try {
      // 构建提示词
      const prompt = this.buildPrompt(task, context);

      // 调用 LLM
      const response = await this.callLLM(prompt);

      // 处理响应
      const result = await this.processResponse(response, task);

      this.setStatus('done' as AgentStatus);
      return result;
    } catch (error) {
      this.setStatus('error' as AgentStatus);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 处理消息
   */
  async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    this.setStatus('thinking' as AgentStatus);

    try {
      const response = await this.callLLM(message.content);

      this.setStatus('idle' as AgentStatus);

      return {
        id: uuidv4(),
        from: this.id,
        to: message.from,
        type: 'response',
        content: response,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.setStatus('error' as AgentStatus);
      return {
        id: uuidv4(),
        from: this.id,
        to: message.from,
        type: 'response',
        content: { error: error instanceof Error ? error.message : String(error) },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 构建提示词
   */
  protected buildPrompt(task: AgentTask, context: AgentContext): string {
    const { systemPrompt } = this.config;
    const { projectName, requirement, prd, design, architecture } = context;

    return `
${systemPrompt}

项目信息：
- 项目名称：${projectName}
- 需求：${requirement}
${prd ? `- PRD：\n${prd}` : ''}
${design ? `- 设计：\n${JSON.stringify(design, null, 2)}` : ''}
${architecture ? `- 架构：\n${JSON.stringify(architecture, null, 2)}` : ''}

当前任务：
- 类型：${task.type}
- 输入：${JSON.stringify(task.input, null, 2)}

请根据你的角色和任务，完成相关工作。输出应该是清晰、结构化的。
    `.trim();
  }

  /**
   * 调用 LLM（智谱 API）
   */
  protected async callLLM(userPrompt: string): Promise<string> {
    const message = await this.llmClient.createMessage({
      maxTokens: this.config.maxTokens || 4000,
      temperature: this.config.temperature || 0.7,
      system: this.config.systemPrompt,
      messages: [
        {
          role: 'system',
          content: this.config.systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // 提取文本内容
    return this.llmClient.extractText(message);
  }

  /**
   * 处理 LLM 响应
   */
  protected async processResponse(
    response: string,
    task: AgentTask
  ): Promise<AgentResult> {
    // 子类可以重写此方法来处理特定的响应格式
    return {
      success: true,
      data: response,
    };
  }

  /**
   * 使用工具
   */
  protected async useTool(toolName: string, params: any): Promise<any> {
    try {
      // 动态导入工具系统
      const { getTool } = await import('../../tools');
      const tool = getTool(toolName);

      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const result = await tool.execute(params);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export default BaseAgent;
