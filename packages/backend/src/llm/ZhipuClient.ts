/**
 * 智谱 AI API 客户端
 */
export class ZhipuClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, model: string = 'glm-4') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  }

  /**
   * 创建聊天完成
   */
  async createMessage(params: {
    maxTokens?: number;
    temperature?: number;
    system?: string;
    messages: Array<{ role: string; content: string }>;
  }) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4000,
        // 智谱 API 特有参数
        top_p: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zhipu API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // 检查错误
    if (data.error) {
      throw new Error(`Zhipu API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data;
  }

  /**
   * 提取文本内容
   */
  extractText(message: any): string {
    if (message.choices && message.choices[0]) {
      return message.choices[0].message.content;
    }
    return '';
  }
}

export default ZhipuClient;
