# AI Team Platform

> 多 AI Agent 团队协作平台 - 一个人 + AI 团队 = 完整软件开发能力

## 项目简介

AI Team Platform 是一个创新的开发工具，通过模拟完整的软件开发团队，让一个人也能完成复杂项目的开发。

### 核心理念

```
输入：一句话需求
  ↓
AI 团队协作（PM + UI + 架构 + 前后端 + 运维）
  ↓
输出：可运行的项目代码
```

### AI 团队角色

| 角色 | 职责 |
|------|------|
| 👔 产品经理 | 需求分析、PRD撰写、竞品分析 |
| 🎨 UI设计师 | 界面设计、设计规范、组件设计 |
| 👁️ 体验官 | 用户研究、体验评估、可用性测试 |
| 📊 产品运营 | 运营策略、数据分析、用户增长 |
| 🏗️ 架构师 | 架构设计、技术选型、性能优化 |
| 💻 前端工程师 | 页面开发、组件封装、状态管理 |
| ⚙️ 后端工程师 | API设计、业务逻辑、数据库设计 |
| 🗄️ 数据库工程师 | 数据库设计、性能优化、SQL优化 |
| 🔧 运维工程师 | 部署方案、监控告警、CI/CD |

## 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus
- Vite
- Pinia

### 后端
- Node.js + TypeScript
- Fastify
- Claude API
- SQLite/PostgreSQL

## 项目结构

```
ai-team-platform/
├── packages/
│   ├── frontend/         # 前端应用
│   ├── backend/          # 后端服务
│   ├── shared/           # 共享代码
│   └── cli/              # CLI 工具
├── agents/               # Agent 配置
├── templates/            # 项目模板
└── README.md
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动前端
pnpm --filter @ai-team/frontend dev

# 启动后端
pnpm --filter @ai-team/backend dev
```

### 构建

```bash
pnpm build
```

## 使用方法

### Web 控制台

1. 访问 http://localhost:3000
2. 输入项目需求
3. 选择技术栈
4. 点击"开始构建"
5. AI 团队自动协作完成项目

### CLI 工具

```bash
# 创建新项目
ai-team build "帮我做一个任务管理系统"

# 查看项目状态
ai-team status

# 与特定 Agent 对话
ai-team talk pm "这个功能需要调整"
```

## 开发路线图

- [x] 项目初始化
- [ ] Agent 基础框架
- [ ] 编排器实现
- [ ] WebSocket 实时通信
- [ ] 工具系统
- [ ] CLI 工具
- [ ] 项目模板
- [ ] VS Code 插件

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT

---

**作者**: 包玉玺 (Brain)
