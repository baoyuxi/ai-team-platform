import { v4 as uuidv4 } from 'uuid';
// 直接从 shared 源码导入类型，避免 workspace 解析问题
import type { AgentConfig } from '@ai-team/shared';
import type { AgentRole } from '@ai-team/shared/src/types';
import { AGENT_CONFIGS } from '@ai-team/shared';
import ProductManagerAgent from './roles/ProductManagerAgent';
import UIDesignerAgent from './roles/UIDesignerAgent';
import ArchitectAgent from './roles/ArchitectAgent';
import FrontendEngineerAgent from './roles/FrontendEngineerAgent';
import BackendEngineerAgent from './roles/BackendEngineerAgent';
import UXResearcherAgent from './roles/UXResearcherAgent';
import ProductOperationAgent from './roles/ProductOperationAgent';
import DatabaseEngineerAgent from './roles/DatabaseEngineerAgent';
import DevOpsEngineerAgent from './roles/DevOpsEngineerAgent';
import type BaseAgent from './base/Agent';

/**
 * Agent 类型映射
 */
const AGENT_CLASSES: Record<string, any> = {
  product_manager: ProductManagerAgent,
  ui_designer: UIDesignerAgent,
  ux_researcher: UXResearcherAgent,
  product_operation: ProductOperationAgent,
  architect: ArchitectAgent,
  frontend_engineer: FrontendEngineerAgent,
  backend_engineer: BackendEngineerAgent,
  database_engineer: DatabaseEngineerAgent,
  devops_engineer: DevOpsEngineerAgent,
};

/**
 * Agent 工厂 - 创建和管理 Agent 实例
 */
export class AgentFactory {
  private apiKey: string;
  private agents: Map<string, BaseAgent>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.agents = new Map();
  }

  /**
   * 创建 Agent
   */
  createAgent(role: string): BaseAgent {
    const AgentClass = AGENT_CLASSES[role];

    if (!AgentClass) {
      throw new Error(`Agent class not found for role: ${role}`);
    }

    const agent = new AgentClass(this.apiKey);
    this.agents.set(agent.getId(), agent);

    return agent;
  }

  /**
   * 批量创建 Agent
   */
  createAgents(roles: string[]): BaseAgent[] {
    return roles.map((role) => this.createAgent(role));
  }

  /**
   * 创建默认团队
   */
  createDefaultTeam(): BaseAgent[] {
    return this.createAgents([
      'product_manager',
      'ui_designer',
      'ux_researcher',
      'product_operation',
      'architect',
      'frontend_engineer',
      'backend_engineer',
      'database_engineer',
      'devops_engineer',
    ]);
  }

  /**
   * 获取 Agent
   */
  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * 根据 Agent 角色获取 Agent
   */
  getAgentByRole(role: string): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.getConfig().role === role) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * 获取所有 Agent
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 销毁 Agent
   */
  destroyAgent(id: string): void {
    this.agents.delete(id);
  }

  /**
   * 销毁所有 Agent
   */
  destroyAll(): void {
    this.agents.clear();
  }

  /**
   * 获取 Agent 数量
   */
  getCount(): number {
    return this.agents.size;
  }
}

export default AgentFactory;
