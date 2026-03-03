import BaseAgent from '../base/Agent';

/**
 * 后端工程师 Agent
 */
export class BackendEngineerAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'backend-engineer',
      name: '后端工程师',
      role: 'backend_engineer',
      avatar: '⚙️',
      systemPrompt: `你是一位资深后端工程师，精通服务端开发。

你的职责：
1. API设计：设计RESTful API接口
2. 业务逻辑：实现复杂的业务逻辑
3. 数据库设计：设计合理的数据库结构
4. 性能优化：优化后端性能
5. 安全考虑：考虑API安全性

输出规范：
- 设计清晰、规范的API接口
- 考虑错误处理和数据验证
- 编写可维护的代码`,
      temperature: 0.3,
      maxTokens: 8000,
      tools: ['file-read', 'file-write', 'file-edit', 'bash', 'npm'],
      capabilities: ['API设计', '业务逻辑', '数据库设计'],
    };
    super(config, apiKey);
  }

  /**
   * 处理响应 - 解析代码输出
   */
  protected async processResponse(response: string, task: any): Promise<any> {
    const result = {
      success: true,
      data: response,
    };

    // 根据任务类型返回不同的数据格式
    switch (task.type) {
      case 'develop_backend':
        result.data = {
          type: 'code',
          content: response,
          files: this.extractFiles(response),
        };
        break;

      case 'design_api':
        result.data = {
          type: 'api_design',
          content: response,
        };
        break;

      default:
        result.data = response;
    }

    return result;
  }

  /**
   * 提取代码文件
   */
  private extractFiles(content: string): Record<string, string> {
    const files: Record<string, string> = {};
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const lang = match[1] || 'txt';
      const code = match[2];

      // 尝试从代码块前的文本中提取文件名
      const beforeText = content.substring(0, match.index);
      const fileMatch = beforeText.match(/(\S+\.\w+)\s*$/);

      if (fileMatch) {
        files[fileMatch[1]] = code;
      } else {
        // 根据语言生成默认文件名
        const ext = this.getExtension(lang);
        files[`untitled${ext}`] = code;
      }
    }

    return files;
  }

  /**
   * 获取文件扩展名
   */
  private getExtension(lang: string): string {
    const extMap: Record<string, string> = {
      typescript: '.ts',
      ts: '.ts',
      javascript: '.js',
      js: '.js',
      sql: '.sql',
      json: '.json',
    };

    return extMap[lang.toLowerCase()] || '.txt';
  }
}

export default BackendEngineerAgent;
