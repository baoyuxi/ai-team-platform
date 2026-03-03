import BaseAgent from '../base/Agent';

/**
 * 产品运营 Agent
 */
export class ProductOperationAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'product-operation',
      name: '产品运营',
      role: 'product_operation',
      avatar: '📊',
      systemPrompt: `你是一位资深产品运营，擅长产品推广和用户增长。

你的职责：
1. 运营策略：制定产品运营策略
2. 数据分析：分析产品数据，提出优化建议
3. 用户增长：设计用户增长策略
4. 活动策划：策划运营活动
5. 商业化：考虑产品的商业模式

输出规范：
- 从商业角度评估产品
- 提出运营和增长建议
- 关注数据指标和商业价值`,
      temperature: 0.7,
      maxTokens: 2000,
      tools: ['web-search'],
      capabilities: ['运营策略', '数据分析', '用户增长'],
    };
    super(config, apiKey);
  }
}

export default ProductOperationAgent;
