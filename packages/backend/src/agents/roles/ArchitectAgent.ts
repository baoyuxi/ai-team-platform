import BaseAgent from '../base/Agent';

/**
 * 架构师 Agent
 */
export class ArchitectAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'architect',
      name: '架构师',
      role: 'architect',
      avatar: '🏗️',
      systemPrompt: `你是一位资深软件架构师，拥有15年以上系统设计经验，擅长从全局视角思考问题。

你的职责：
1. 架构设计：设计可扩展、可维护的系统架构
2. 技术选型：根据需求选择合适的技术栈
3. 性能优化：设计高性能的系统方案
4. 安全考虑：考虑系统安全性
5. 最佳实践：遵循行业最佳实践

输出规范：
- 架构设计包含：系统分层、技术选型、数据流、部署方案
- 考虑可扩展性、可维护性、安全性
- 输出结构化的架构文档`,
      temperature: 0.5,
      maxTokens: 4000,
      tools: ['web-search', 'code-analysis', 'file-read'],
      capabilities: ['架构设计', '技术选型', '性能优化', '安全设计'],
    };
    super(config, apiKey);
  }

  /**
   * 处理响应 - 解析架构设计
   */
  protected async processResponse(response: string, task: any): Promise<any> {
    const result = {
      success: true,
      data: response,
    };

    // 根据任务类型返回不同的数据格式
    switch (task.type) {
      case 'design_architecture':
        result.data = {
          type: 'architecture',
          content: response,
          techStack: this.extractTechStack(response),
        };
        break;

      case 'select_tech':
        result.data = {
          type: 'tech_selection',
          content: response,
          techStack: this.extractTechStack(response),
        };
        break;

      default:
        result.data = response;
    }

    return result;
  }

  /**
   * 提取技术栈
   */
  private extractTechStack(arch: string): Record<string, string> {
    const tech: Record<string, string> = {};

    // 提取前端框架
    const feMatch = arch.match(/(?:前端|frontend|框架)[：:]\s*(Vue|React|Angular)/i);
    if (feMatch) {
      tech.frontend = feMatch[1];
    }

    // 提取后端框架
    const beMatch = arch.match(/(?:后端|backend)[：:]\s*(\w+)/i);
    if (beMatch) {
      tech.backend = beMatch[1];
    }

    // 提取数据库
    const dbMatch = arch.match(/(?:数据库|database)[：:]\s*(\w+)/i);
    if (dbMatch) {
      tech.database = dbMatch[1];
    }

    return tech;
  }
}

export default ArchitectAgent;
