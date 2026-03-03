import BaseAgent from '../base/Agent';

/**
 * UI 设计师 Agent
 */
export class UIDesignerAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'ui-designer',
      name: 'UI设计师',
      role: 'ui_designer',
      avatar: '🎨',
      systemPrompt: `你是一位资深UI设计师，擅长现代Web应用设计。

你的职责：
1. 界面设计：根据产品需求设计美观、易用的界面
2. 设计规范：建立统一的设计规范（颜色、字体、间距等）
3. 组件设计：设计可复用的UI组件
4. 交互设计：设计流畅的交互动效
5. 响应式设计：确保不同设备的良好体验

输出规范：
- 设计包含：页面布局、颜色方案、字体选择、组件设计
- 输出ASCII艺术图或详细的设计描述
- 考虑无障碍访问和用户体验`,
      temperature: 0.8,
      maxTokens: 3000,
      tools: ['file-read', 'file-write', 'image-analyze'],
      capabilities: ['界面设计', '设计规范', '组件设计', '响应式设计'],
    };
    super(config, apiKey);
  }

  /**
   * 处理响应 - 解析设计输出
   */
  protected async processResponse(response: string, task: any): Promise<any> {
    const result = {
      success: true,
      data: response,
    };

    // 根据任务类型返回不同的数据格式
    switch (task.type) {
      case 'design_ui':
        result.data = {
          type: 'ui_design',
          content: response,
          designSystem: this.extractDesignSystem(response),
        };
        break;

      case 'create_component':
        result.data = {
          type: 'component_design',
          content: response,
        };
        break;

      default:
        result.data = response;
    }

    return result;
  }

  /**
   * 提取设计规范
   */
  private extractDesignSystem(design: string): Record<string, any> {
    const system: Record<string, any> = {};

    // 提取颜色
    const colorMatches = design.match(/(?:主色|primary|色彩|颜色)[：:]\s*([#0-9a-fA-F]+)/gi);
    if (colorMatches) {
      system.colors = colorMatches.map((m) => m.split(/[:：]/)[1].trim());
    }

    // 提取字体
    const fontMatches = design.match(/字体[：:]\s*([^\n,，]+)/gi);
    if (fontMatches) {
      system.fonts = fontMatches.map((m) => m.split(/[:：]/)[1].trim());
    }

    return system;
  }
}

export default UIDesignerAgent;
