<template>
  <div class="workspace-view">
    <el-container>
      <el-header>
        <div class="header-left">
          <el-button @click="back" :icon="ArrowLeft">返回</el-button>
          <h2 v-if="!loading">{{ project?.name }}</h2>
          <el-skeleton v-else style="width: 200px" animated>
            <template #template>
              <el-skeleton-item variant="text" />
            </template>
          </el-skeleton>
          <el-tag v-if="wsStore.connected" type="success" size="small">
            {{ wsStore.connectionStatus }}
          </el-tag>
          <el-tag v-else type="info" size="small">
            {{ wsStore.connectionStatus }}
          </el-tag>
          <el-tag v-if="project" :type="getStatusType(project.status)" size="small">
            {{ getStatusText(project.status) }}
          </el-tag>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="exportProject" :loading="exporting">
            导出项目
          </el-button>
        </div>
      </el-header>

      <el-container v-loading="loading && !project">
        <!-- 左侧边栏 - Agent 团队 -->
        <el-aside width="280px">
          <el-card class="agents-card">
            <template #header>
              <span>👥 AI 团队</span>
            </template>

            <div class="agent-list">
              <div
                v-for="agent in agents"
                :key="agent.id"
                class="agent-item"
                :class="{ active: selectedAgent === agent.id }"
                @click="selectAgent(agent.id)"
              >
                <div class="agent-avatar">{{ agent.avatar }}</div>
                <div class="agent-info">
                  <div class="agent-name">{{ agent.name }}</div>
                  <div class="agent-role">{{ agent.role }}</div>
                </div>
                <div class="agent-status">
                  <el-tag :type="getStatusType(agent.status)" size="small">
                    {{ getStatusText(agent.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 工作流程 -->
          <el-card class="workflow-card">
            <template #header>
              <span>📋 工作流程</span>
            </template>

            <el-timeline>
              <el-timeline-item
                v-for="stage in workflow"
                :key="stage.id"
                :type="getStageType(stage.status)"
                :icon="getStageIcon(stage.status)"
              >
                <div class="stage-item">
                  <div class="stage-name">{{ stage.name }}</div>
                  <div class="stage-agent">{{ stage.agent }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-aside>

        <!-- 主内容区 -->
        <el-main>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="💬 协作记录" name="chat">
              <div class="chat-container">
                <div class="message-list" ref="messageListRef">
                  <el-empty v-if="displayMessages.length === 0" description="暂无消息，开始与 AI 团队对话吧！" />

                  <div
                    v-for="msg in displayMessages"
                    :key="msg.id"
                    class="message-item"
                    :class="{ 'is-self': msg.from === 'user' }"
                  >
                    <div class="message-avatar">{{ getAgentAvatar(msg.from) }}</div>
                    <div class="message-content">
                      <div class="message-header">
                        <span class="message-sender">{{ getAgentName(msg.from) }}</span>
                        <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                      </div>
                      <div class="message-body">{{ formatMessageContent(msg.content) }}</div>
                    </div>
                  </div>
                </div>

                <div class="message-input">
                  <el-input
                    v-model="inputMessage"
                    type="textarea"
                    :placeholder="inputPlaceholder"
                    :rows="3"
                    @keydown.ctrl.enter="sendMessage"
                    :disabled="!wsStore.connected"
                  />
                  <el-button
                    type="primary"
                    @click="sendMessage"
                    :disabled="!inputMessage || !wsStore.connected"
                  >
                    发送 (Ctrl+Enter)
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="📁 项目文件" name="files">
              <div class="file-tree">
                <el-empty v-if="fileTree.length === 0" description="暂无文件，等待 AI 团队生成代码..." />
                <el-tree v-else :data="fileTree" node-key="path" default-expand-all>
                  <template #default="{ node, data }">
                    <span class="tree-node">
                      <span>{{ data.icon }}</span>
                      <span>{{ node.label }}</span>
                    </span>
                  </template>
                </el-tree>
              </div>
            </el-tab-pane>

            <el-tab-pane label="📊 项目详情" name="detail">
              <el-descriptions v-if="project" :column="2" border>
                <el-descriptions-item label="项目名称">
                  {{ project.name }}
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(project.status)">
                    {{ getStatusText(project.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ formatDate(project.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="技术栈">
                  {{ getTechStackName(project.techStack) }}
                </el-descriptions-item>
                <el-descriptions-item label="项目描述" :span="2">
                  {{ project.description || '暂无描述' }}
                </el-descriptions-item>
                <el-descriptions-item label="需求" :span="2">
                  {{ project.requirement }}
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
          </el-tabs>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import { useWebSocketStore } from '@/stores/websocket';
import type { AgentMessage } from '@ai-team/shared';

const router = useRouter();
const route = useRoute();
const projectStore = useProjectStore();
const wsStore = useWebSocketStore();

const project = ref<any>(null);
const agents = ref<any[]>([]);
const workflow = ref<any[]>([]);
const fileTree = ref<any[]>([]);
const selectedAgent = ref<string>('');
const activeTab = ref('chat');
const inputMessage = ref('');
const loading = ref(true);
const exporting = ref(false);
const messageListRef = ref<HTMLElement | null>(null);

const mockAgents = [
  { id: 'pm', name: '产品经理', role: '需求分析', avatar: '👔', status: 'done' },
  { id: 'ui', name: 'UI设计师', role: '界面设计', avatar: '🎨', status: 'done' },
  { id: 'arch', name: '架构师', role: '架构设计', avatar: '🏗️', status: 'working' },
  { id: 'fe', name: '前端工程师', role: '前端开发', avatar: '💻', status: 'waiting' },
  { id: 'be', name: '后端工程师', role: '后端开发', avatar: '⚙️', status: 'waiting' },
  { id: 'ux', name: '体验官', role: '体验评估', avatar: '👁️', status: 'waiting' },
  { id: 'po', name: '产品运营', role: '运营策略', avatar: '📊', status: 'waiting' },
  { id: 'db', name: '数据库工程师', role: '数据库', avatar: '🗄️', status: 'waiting' },
  { id: 'ops', name: '运维工程师', role: '运维', avatar: '🔧', status: 'waiting' },
];

const mockWorkflow = [
  { id: '1', name: '需求分析', agent: '产品经理', status: 'success' },
  { id: '2', name: 'UI设计', agent: 'UI设计师', status: 'success' },
  { id: '3', name: '架构设计', agent: '架构师', status: 'process' },
  { id: '4', name: '前端开发', agent: '前端工程师', status: 'info' },
  { id: '5', name: '后端开发', agent: '后端工程师', status: 'info' },
];

// 显示的消息
const displayMessages = computed(() => {
  return wsStore.messages;
});

// 输入框占位符
const inputPlaceholder = computed(() => {
  if (!wsStore.connected) {
    return 'WebSocket 未连接...';
  }
  if (selectedAgent.value) {
    return `发送消息给: ${getSelectedAgentName()}`;
  }
  return '输入消息...（发送给所有人）';
});

onMounted(async () => {
  // 连接 WebSocket
  wsStore.connect();

  // 加载项目
  try {
    project.value = await projectStore.loadProject(route.params.id as string);
    agents.value = mockAgents;
    workflow.value = mockWorkflow;
  } catch (error) {
    ElMessage.error('项目加载失败');
  } finally {
    loading.value = false;
  }

  // 滚动到底部
  scrollToBottom();
});

onUnmounted(() => {
  wsStore.disconnect();
});

// 监听消息变化，自动滚动到底部
watch(() => wsStore.messages.length, () => {
  scrollToBottom();
});

function back() {
  router.push('/project');
}

function selectAgent(id: string) {
  selectedAgent.value = id;
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    done: 'success',
    working: 'warning',
    waiting: 'info',
    error: 'danger',
  };
  return map[status] || 'info';
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    done: '已完成',
    working: '工作中',
    waiting: '等待中',
    error: '错误',
    success: '成功',
    process: '进行中',
    info: '待处理',
  };
  return map[status] || status;
}

function getStageType(status: string) {
  const map: Record<string, string> = {
    success: 'success',
    process: 'primary',
    info: 'info',
  };
  return map[status] || 'info';
}

function getStageIcon(status: string) {
  return status === 'success' ? '✓' : status === 'process' ? '●' : '○';
}

function getAgentAvatar(id: string) {
  const agent = agents.value.find((a) => a.id === id);
  return agent?.avatar || '🤖';
}

function getAgentName(id: string) {
  if (id === 'user') return '你';
  const agent = agents.value.find((a) => a.id === id);
  return agent?.name || 'Unknown';
}

function getSelectedAgentName() {
  if (!selectedAgent.value) return '所有人';
  const agent = agents.value.find((a) => a.id === selectedAgent.value);
  return agent?.name || 'Unknown';
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('zh-CN');
}

function formatDate(timestamp?: number) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-CN');
}

function formatMessageContent(content: any) {
  if (typeof content === 'string') return content;
  if (content?.text) return content.text;
  if (content?.message) return content.message;
  return JSON.stringify(content);
}

function getTechStackName(techStack?: string) {
  const map: Record<string, string> = {
    'vue3-ts': 'Vue3 + TypeScript',
    'react-ts': 'React + TypeScript',
    'fullstack': '全栈应用',
  };
  return map[techStack || ''] || techStack || '未知';
}

function sendMessage() {
  if (!inputMessage.value) return;

  const to = selectedAgent.value || 'all';

  // 添加到消息列表（本地显示）
  wsStore.messages.push({
    id: Date.now().toString(),
    from: 'user',
    to,
    content: inputMessage.value,
    timestamp: Date.now(),
  });

  // 发送到服务器
  wsStore.sendToAgent(to, {
    type: 'chat',
    message: inputMessage.value,
  });

  inputMessage.value = '';
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

function exportProject() {
  exporting.value = true;

  // TODO: 实现项目导出
  setTimeout(() => {
    ElMessage.success('项目导出功能开发中...');
    exporting.value = false;
  }, 1000);
}
</script>

<style scoped>
.workspace-view {
  height: 100vh;
}

.el-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
}

.el-aside {
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.agents-card,
.workflow-card {
  flex: 1;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.agent-item:hover {
  background: #f0f0f0;
}

.agent-item.active {
  background: #e6f7ff;
  border: 1px solid #1890ff;
}

.agent-avatar {
  font-size: 24px;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-weight: 500;
  font-size: 14px;
}

.agent-role {
  font-size: 12px;
  color: #909399;
}

.stage-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-name {
  font-weight: 500;
  font-size: 14px;
}

.stage-agent {
  font-size: 12px;
  color: #909399;
}

.el-main {
  background: white;
  padding: 20px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-item.is-self {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 32px;
}

.message-content {
  max-width: 70%;
}

.message-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.message-sender {
  font-weight: 500;
  font-size: 12px;
  color: #606266;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-body {
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
}

.message-item.is-self .message-body {
  background: #e6f7ff;
}

.message-input {
  display: flex;
  gap: 12px;
}

.message-input .el-input {
  flex: 1;
}

.tree-node {
  display: flex;
  gap: 8px;
}
</style>
