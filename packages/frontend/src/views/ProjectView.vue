<template>
  <div class="project-view">
    <el-container>
      <el-header>
        <h1>🤖 AI Team Platform</h1>
        <p>一个人 + AI 团队 = 完整软件开发能力</p>
      </el-header>

      <el-main>
        <el-card class="create-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>创建新项目</span>
            </div>
          </template>

          <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="form.name" placeholder="输入项目名称" />
            </el-form-item>

            <el-form-item label="项目描述">
              <el-input
                v-model="form.description"
                type="textarea"
                placeholder="输入项目描述"
                :rows="3"
              />
            </el-form-item>

            <el-form-item label="项目需求" prop="requirement">
              <el-input
                v-model="form.requirement"
                type="textarea"
                placeholder="描述你的项目需求，AI 团队会帮你实现"
                :rows="5"
              />
            </el-form-item>

            <el-form-item label="技术栈">
              <el-select v-model="form.template" placeholder="选择技术栈">
                <el-option label="Vue3 + TypeScript" value="vue3-ts" />
                <el-option label="React + TypeScript" value="react-ts" />
                <el-option label="全栈应用" value="fullstack" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="createProject" :loading="creating">
                <el-icon><MagicStick /></el-icon>
                开始构建
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-divider />

        <el-card class="projects-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>项目列表</span>
              <el-button text @click="loadProjects" :icon="Refresh">刷新</el-button>
            </div>
          </template>

          <el-empty v-if="!hasProjects" description="暂无项目">
            <el-button type="primary" @click="showCreateCard">创建第一个项目</el-button>
          </el-empty>

          <div v-else class="project-list">
            <el-card
              v-for="project in projects"
              :key="project.id"
              class="project-item"
              shadow="hover"
              @click="openProject(project.id)"
            >
              <div class="project-header">
                <h3>{{ project.name }}</h3>
                <el-tag :type="getStatusType(project.status)">
                  {{ getStatusText(project.status) }}
                </el-tag>
              </div>
              <p class="project-desc">{{ project.description || '暂无描述' }}</p>
              <p class="project-requirement">{{ project.requirement }}</p>
              <div class="project-meta">
                <span>创建于 {{ formatDate(project.createdAt) }}</span>
                <el-tag size="small">{{ getTechStackName(project.techStack) }}</el-tag>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { MagicStick, Refresh } from '@element-plus/icons-vue';
import { useProjectStore } from '@/stores/project';

const router = useRouter();
const projectStore = useProjectStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const creating = ref(false);

const form = reactive({
  name: '',
  description: '',
  requirement: '',
  template: 'vue3-ts',
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  requirement: [
    { required: true, message: '请输入项目需求', trigger: 'blur' },
    { min: 10, message: '需求描述至少 10 个字符', trigger: 'blur' },
  ],
};

const projects = computed(() => projectStore.projects);
const hasProjects = computed(() => projectStore.hasProjects);

onMounted(async () => {
  await loadProjects();
});

async function loadProjects() {
  loading.value = true;
  try {
    await projectStore.loadProjects();
  } catch (error) {
    ElMessage.error('加载项目列表失败');
  } finally {
    loading.value = false;
  }
}

async function createProject() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  creating.value = true;

  try {
    await projectStore.createProject({
      name: form.name,
      description: form.description,
      requirement: form.requirement,
      techStack: form.template,
    });

    ElMessage.success('项目创建成功！');
    router.push(`/workspace/${projectStore.currentProject?.id}`);

    // 清空表单
    form.name = '';
    form.description = '';
    form.requirement = '';
    form.template = 'vue3-ts';
  } catch (error: any) {
    ElMessage.error(error.message || '项目创建失败');
  } finally {
    creating.value = false;
  }
}

function openProject(id: string) {
  router.push(`/workspace/${id}`);
}

function showCreateCard() {
  // 滚动到创建卡片
  document.querySelector('.create-card')?.scrollIntoView({ behavior: 'smooth' });
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    created: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  };
  return map[status] || 'info';
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    created: '已创建',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  };
  return map[status] || status;
}

function getTechStackName(techStack?: string) {
  const map: Record<string, string> = {
    'vue3-ts': 'Vue3 + TypeScript',
    'react-ts': 'React + TypeScript',
    'fullstack': '全栈应用',
  };
  return map[techStack || ''] || techStack || '未知';
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN');
}
</script>

<style scoped>
.project-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.el-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.el-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.el-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.el-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.create-card {
  margin-bottom: 20px;
}

.projects-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-item {
  cursor: pointer;
  transition: all 0.3s;
}

.project-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-header h3 {
  margin: 0;
  font-size: 16px;
}

.project-desc {
  color: #606266;
  font-size: 14px;
  margin: 8px 0;
}

.project-requirement {
  color: #909399;
  font-size: 12px;
  margin: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
  margin-top: 12px;
}
</style>
