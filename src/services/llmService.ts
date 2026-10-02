import { ChatMessage, LLMConfig } from '../types';

export class LLMService {
  /**
   * Stream LLM response
   */
  public static async streamChat(
    config: LLMConfig,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    onToken: (token: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const { provider, apiKey, baseUrl, model, temperature, maxTokens } = config;

    if (provider === 'gemini') {
      return this.streamGemini(apiKey, baseUrl, model, messages, onToken, signal);
    } else if (provider === 'anthropic') {
      return this.streamClaude(apiKey, baseUrl, model, messages, onToken, signal);
    } else if (provider === 'ollama') {
      return this.streamOllama(baseUrl, model, messages, onToken, signal);
    } else {
      // Default: OpenAI, DeepSeek, SiliconFlow, Custom (OpenAI-compatible)
      return this.streamOpenAICompatible(apiKey, baseUrl, model, temperature, maxTokens, messages, onToken, signal);
    }
  }

  /**
   * OpenAI / DeepSeek / SiliconFlow / Compatible SSE streaming
   */
  private static async streamOpenAICompatible(
    apiKey: string,
    baseUrl: string,
    model: string,
    temperature: number,
    maxTokens: number,
    messages: { role: string; content: string }[],
    onToken: (t: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const url = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onToken(delta);
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    }

    return fullText;
  }

  /**
   * Google Gemini REST streaming
   */
  private static async streamGemini(
    apiKey: string,
    baseUrl: string,
    model: string,
    messages: { role: string; content: string }[],
    onToken: (t: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const geminiModel = model || 'gemini-2.0-flash';
    const effectiveBase = baseUrl || 'https://generativelanguage.googleapis.com';
    const url = `${effectiveBase}/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}&alt=sse`;

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const systemInstruction = messages.find(m => m.role === 'system');

    const body: Record<string, unknown> = { contents };
    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction.content }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body in Gemini response');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
              fullText += chunk;
              onToken(chunk);
            }
          } catch {}
        }
      }
    }

    return fullText;
  }

  /**
   * Anthropic Claude Streaming
   */
  private static async streamClaude(
    apiKey: string,
    baseUrl: string,
    model: string,
    messages: { role: string; content: string }[],
    onToken: (t: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const url = `${baseUrl || 'https://api.anthropic.com'}/v1/messages`;
    const system = messages.find(m => m.role === 'system')?.content;
    const conversation = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        messages: conversation,
        system,
        max_tokens: 1024,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body in Claude response');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta') {
              const text = data.delta?.text || '';
              fullText += text;
              onToken(text);
            }
          } catch {}
        }
      }
    }

    return fullText;
  }

  /**
   * Ollama Local LLM Streaming
   */
  private static async streamOllama(
    baseUrl: string,
    model: string,
    messages: { role: string; content: string }[],
    onToken: (t: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const url = `${baseUrl || 'http://localhost:11434'}/api/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body in Ollama response');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const token = json.message?.content || '';
          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {}
      }
    }

    return fullText;
  }
}
