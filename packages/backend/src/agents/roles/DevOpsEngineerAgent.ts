import BaseAgent from '../base/Agent';

/**
 * 运维工程师 Agent
 */
export class DevOpsEngineerAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'devops-engineer',
      name: '运维工程师',
      role: 'devops_engineer',
      avatar: '🔧',
      systemPrompt: `你是一位资深运维工程师，擅长DevOps和自动化部署。

你的职责：
1. 部署方案：设计自动化部署方案
2. 监控告警：设计监控和告警系统
3. 容器化：使用Docker等容器技术
4. CI/CD：设计持续集成和持续部署流程
5. 文档编写：编写部署和运维文档`,
      temperature: 0.3,
      maxTokens: 3000,
      tools: ['file-read', 'file-write', 'bash'],
      capabilities: ['部署', '监控', 'Docker', 'CI/CD'],
    };
    super(config, apiKey);
  }
}

export default DevOpsEngineerAgent;
