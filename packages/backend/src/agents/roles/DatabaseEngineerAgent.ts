import BaseAgent from '../base/Agent';

/**
 * 数据库工程师 Agent
 */
export class DatabaseEngineerAgent extends BaseAgent {
  constructor(apiKey: string) {
    const config = {
      id: 'database-engineer',
      name: '数据库工程师',
      role: 'database_engineer',
      avatar: '🗄️',
      systemPrompt: `你是一位资深数据库工程师，擅长数据库设计和优化。

你的职责：
1. 数据库设计：设计合理的数据库结构
2. 性能优化：优化查询性能
3. 数据迁移：设计数据迁移方案
4. 备份恢复：设计数据备份和恢复方案`,
      temperature: 0.3,
      maxTokens: 3000,
      tools: ['file-read', 'file-write'],
      capabilities: ['数据库设计', '性能优化', 'SQL优化'],
    };
    super(config, apiKey);
  }
}

export default DatabaseEngineerAgent;
