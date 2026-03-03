import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Tool, ToolResult } from '@ai-team/shared';

/**
 * 文件读取工具
 */
export class FileReadTool implements Tool {
  name = 'file_read';
  description = '读取文件内容';
  parameters = {
    path: {
      type: 'string',
      description: '文件路径',
      required: true,
    },
  };

  async execute(params: { path: string }): Promise<ToolResult> {
    try {
      const content = await readFile(params.path, 'utf-8');
      return {
        success: true,
        data: { content, path: params.path },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * 文件写入工具
 */
export class FileWriteTool implements Tool {
  name = 'file_write';
  description = '写入文件内容';
  parameters = {
    path: {
      type: 'string',
      description: '文件路径',
      required: true,
    },
    content: {
      type: 'string',
      description: '文件内容',
      required: true,
    },
  };

  async execute(params: { path: string; content: string }): Promise<ToolResult> {
    try {
      // 确保目录存在
      const dir = join(params.path, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(params.path, params.content, 'utf-8');
      return {
        success: true,
        data: { path: params.path, written: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * 文件编辑工具
 */
export class FileEditTool implements Tool {
  name = 'file_edit';
  description = '编辑文件的指定部分';
  parameters = {
    path: {
      type: 'string',
      description: '文件路径',
      required: true,
    },
    oldText: {
      type: 'string',
      description: '要替换的旧文本',
      required: true,
    },
    newText: {
      type: 'string',
      description: '新文本',
      required: true,
    },
  };

  async execute(params: {
    path: string;
    oldText: string;
    newText: string;
  }): Promise<ToolResult> {
    try {
      const content = await readFile(params.path, 'utf-8');
      const newContent = content.replace(params.oldText, params.newText);

      if (content === newContent) {
        return {
          success: false,
          error: 'Old text not found in file',
        };
      }

      await writeFile(params.path, newContent, 'utf-8');
      return {
        success: true,
        data: { path: params.path, edited: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * 目录列表工具
 */
export class ListDirTool implements Tool {
  name = 'list_dir';
  description = '列出目录内容';
  parameters = {
    path: {
      type: 'string',
      description: '目录路径',
      required: true,
    },
  };

  async execute(params: { path: string }): Promise<ToolResult> {
    try {
      const fs = await import('fs/promises');
      const entries = await fs.readdir(params.path, { withFileTypes: true });

      const items = entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      }));

      return {
        success: true,
        data: { path: params.path, items },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Bash 命令工具
 */
export class BashTool implements Tool {
  name = 'bash';
  description = '执行 Bash 命令';
  parameters = {
    command: {
      type: 'string',
      description: '要执行的命令',
      required: true,
    },
  };

  async execute(params: { command: string }): Promise<ToolResult> {
    try {
      const { exec } = await import('child_process');

      return new Promise((resolve) => {
        exec(params.command, (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              error: stderr || error.message,
              data: { exitCode: (error as any).code },
            });
          } else {
            resolve({
              success: true,
              data: { stdout, stderr },
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * NPM 工具
 */
export class NpmTool implements Tool {
  name = 'npm';
  description = '执行 NPM 命令';
  parameters = {
    command: {
      type: 'string',
      description: 'NPM 命令（如：install, run build）',
      required: true,
    },
    args: {
      type: 'array',
      description: '命令参数',
      required: false,
    },
  };

  async execute(params: {
    command: string;
    args?: string[];
  }): Promise<ToolResult> {
    try {
      const { spawn } = await import('child_process');

      return new Promise((resolve) => {
        const args = params.args || [];
        const process = spawn('npm', [params.command, ...args]);

        let stdout = '';
        let stderr = '';

        process.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve({
              success: true,
              data: { stdout, stderr, exitCode: code },
            });
          } else {
            resolve({
              success: false,
              error: stderr || `Command failed with exit code ${code}`,
              data: { exitCode: code },
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Git 工具
 */
export class GitTool implements Tool {
  name = 'git';
  description = '执行 Git 命令';
  parameters = {
    command: {
      type: 'string',
      description: 'Git 命令（如：status, add, commit）',
      required: true,
    },
    args: {
      type: 'array',
      description: '命令参数',
      required: false,
    },
  };

  async execute(params: {
    command: string;
    args?: string[];
  }): Promise<ToolResult> {
    try {
      const { spawn } = await import('child_process');

      return new Promise((resolve) => {
        const args = params.args || [];
        const process = spawn('git', [params.command, ...args]);

        let stdout = '';
        let stderr = '';

        process.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve({
              success: true,
              data: { stdout, stderr, exitCode: code },
            });
          } else {
            resolve({
              success: false,
              error: stderr || `Command failed with exit code ${code}`,
              data: { exitCode: code },
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * 工具注册表
 */
export const TOOL_REGISTRY: Record<string, Tool> = {
  file_read: new FileReadTool(),
  file_write: new FileWriteTool(),
  file_edit: new FileEditTool(),
  list_dir: new ListDirTool(),
  bash: new BashTool(),
  npm: new NpmTool(),
  git: new GitTool(),
};

/**
 * 获取工具
 */
export function getTool(name: string): Tool | undefined {
  return TOOL_REGISTRY[name];
}

/**
 * 获取所有工具
 */
export function getAllTools(): Tool[] {
  return Object.values(TOOL_REGISTRY);
}
