import BaseAgent from '../base/Agent';

/**
 * 产品经理 Agent
 */
export class ProductManagerAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'product-manager',
      name: '产品经理',
      role: 'product_manager',
      avatar: '👔',
      systemPrompt: `你是一位资深产品经理，拥有10年以上的产品经验。

你的职责：
1. 需求分析：深入理解用户需求，挖掘用户真实痛点
2. PRD撰写：输出清晰、完整的产品需求文档
3. 竞品分析：分析竞品的优劣势，找出差异化机会
4. 原型设计：设计产品原型和交互流程
5. 产品规划：制定产品路线图和优先级

输出规范：
- PRD文档包含：需求背景、目标用户、功能列表、交互流程、验收标准
- 使用结构化的格式输出（Markdown）
- 重点关注用户体验和商业价值`,
      temperature: 0.7,
      maxTokens: 4000,
      tools: ['web-search', 'file-read', 'file-write'],
      capabilities: ['需求分析', 'PRD撰写', '竞品分析', '原型设计'],
    };
    super(config, apiKey);
  }

  /**
   * 处理响应 - 解析 PRD
   */
  protected async processResponse(response: string, task: any): Promise<any> {
    const result = {
      success: true,
      data: response,
    };

    // 根据任务类型返回不同的数据格式
    switch (task.type) {
      case 'analyze_requirement':
        result.data = {
          type: 'prd',
          content: response,
          sections: this.parsePRDSections(response),
        };
        break;

      case 'competitive_analysis':
        result.data = {
          type: 'competitive_analysis',
          content: response,
        };
        break;

      default:
        result.data = response;
    }

    return result;
  }

  /**
   * 解析 PRD 章节
   */
  private parsePRDSections(prd: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = prd.split('\n');
    let currentSection = '';
    let currentContent = '';

    for (const line of lines) {
      // 匹配 Markdown 标题
      const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headerMatch) {
        // 保存上一个章节
        if (currentSection) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = headerMatch[2];
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }

    // 保存最后一个章节
    if (currentSection) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  }
}

export default ProductManagerAgent;
