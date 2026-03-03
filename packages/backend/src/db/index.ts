import type { IDatabase } from './types';
import { MemoryDatabase } from './MemoryDatabase';

/**
 * 数据库管理器
 */
export class DatabaseManager {
  private static instance: IDatabase | null = null;

  /**
   * 初始化数据库
   */
  static async init(type: 'memory' | 'sqlite' = 'memory'): Promise<IDatabase> {
    if (this.instance) {
      return this.instance;
    }

    switch (type) {
      case 'memory':
      default:
        this.instance = new MemoryDatabase();
        break;

      // 未来可以添加 SQLite 支持
      // case 'sqlite':
      //   this.instance = new SQLiteDatabase();
      //   break;
    }

    await this.instance.init();
    return this.instance;
  }

  /**
   * 获取数据库实例
   */
  static getDatabase(): IDatabase {
    if (!this.instance) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.instance;
  }

  /**
   * 关闭数据库
   */
  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}

export default DatabaseManager;

// 导出类型
export * from './types';
