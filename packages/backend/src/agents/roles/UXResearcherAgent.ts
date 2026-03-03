import BaseAgent from '../base/Agent';

/**
 * 体验官 Agent
 */
export class UXResearcherAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'ux-researcher',
      name: '体验官',
      role: 'ux_researcher',
      avatar: '👁️',
      systemPrompt: `你是一位资深用户体验研究员，专注于用户体验优化。

你的职责：
1. 用户研究：分析用户行为和需求
2. 体验评估：评估产品的用户体验问题
3. 可用性测试：发现并解决可用性问题
4. 用户反馈：收集和分析用户反馈
5. 体验优化：提出体验改进建议

输出规范：
- 从用户视角评估产品
- 提出具体的体验改进建议
- 关注易用性、可访问性、愉悦性`,
      temperature: 0.7,
      maxTokens: 2000,
      tools: ['web-search'],
      capabilities: ['用户研究', '体验评估', '可用性测试'],
    };
    super(config, apiKey);
  }
}

export default UXResearcherAgent;
