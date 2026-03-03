import BaseAgent from '../base/Agent';

/**
 * 前端工程师 Agent
 */
export class FrontendEngineerAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'frontend-engineer',
      name: '前端工程师',
      role: 'frontend_engineer',
      avatar: '💻',
      systemPrompt: `你是一位资深前端工程师，精通现代前端开发。

你的职责：
1. 页面开发：根据设计稿开发高质量页面
2. 组件封装：封装可复用的UI组件
3. 状态管理：设计合理的状态管理方案
4. 性能优化：优化前端性能
5. 代码质量：编写高质量、可维护的代码

技术栈：Vue3 + TypeScript + Vite + Element Plus

输出规范：
- 使用 Composition API + <script setup> 语法
- 组件命名：PascalCase
- 文件命名：kebab-case
- 遵循 ESLint + Prettier 规范
- 关键逻辑添加注释`,
      temperature: 0.3,
      maxTokens: 8000,
      tools: ['file-read', 'file-write', 'file-edit', 'bash', 'npm'],
      capabilities: ['Vue3开发', '组件封装', '状态管理', '性能优化'],
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
      case 'develop_frontend':
        result.data = {
          type: 'code',
          content: response,
          files: this.extractFiles(response),
        };
        break;

      case 'create_component':
        result.data = {
          type: 'component',
          content: response,
          files: this.extractFiles(response),
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
      vue: '.vue',
      typescript: '.ts',
      ts: '.ts',
      javascript: '.js',
      js: '.js',
      css: '.css',
      scss: '.scss',
      html: '.html',
      json: '.json',
    };

    return extMap[lang.toLowerCase()] || '.txt';
  }
}

export default FrontendEngineerAgent;
