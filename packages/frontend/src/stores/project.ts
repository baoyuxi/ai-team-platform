import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { projectApi } from '@/services/api';
import type { ProjectConfig } from '@ai-team/shared';

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<ProjectConfig[]>([]);
  const currentProject = ref<ProjectConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const hasProjects = computed(() => projects.value.length > 0);

  /**
   * 加载项目列表
   */
  async function loadProjects() {
    loading.value = true;
    error.value = null;

    try {
      const response = await projectApi.getList();
      projects.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败';
      console.error('Error loading projects:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建项目
   */
  async function createProject(data: {
    name: string;
    description?: string;
    requirement: string;
    techStack?: any;
  }) {
    loading.value = true;
    error.value = null;

    try {
      const response = await projectApi.create(data);
      projects.value.push(response.data);
      currentProject.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建失败';
      console.error('Error creating project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载项目详情
   */
  async function loadProject(id: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await projectApi.getDetail(id);
      currentProject.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败';
      console.error('Error loading project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新项目
   */
  async function updateProject(id: string, data: Partial<ProjectConfig>) {
    loading.value = true;
    error.value = null;

    try {
      const response = await projectApi.update(id, data);
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value[index] = response.data;
      }
      if (currentProject.value?.id === id) {
        currentProject.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新失败';
      console.error('Error updating project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除项目
   */
  async function deleteProject(id: string) {
    loading.value = true;
    error.value = null;

    try {
      await projectApi.delete(id);
      projects.value = projects.value.filter((p) => p.id !== id);
      if (currentProject.value?.id === id) {
        currentProject.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除失败';
      console.error('Error deleting project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 执行工作流
   */
  async function executeWorkflow(id: string, requirement: string, options: any = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await projectApi.execute(id, { requirement, ...options });
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '执行失败';
      console.error('Error executing workflow:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 设置当前项目
   */
  function setCurrentProject(project: ProjectConfig | null) {
    currentProject.value = project;
  }

  /**
   * 重置状态
   */
  function reset() {
    projects.value = [];
    currentProject.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // 状态
    projects,
    currentProject,
    loading,
    error,

    // 计算属性
    hasProjects,

    // 方法
    loadProjects,
    createProject,
    loadProject,
    updateProject,
    deleteProject,
    executeWorkflow,
    setCurrentProject,
    reset,
  };
});
