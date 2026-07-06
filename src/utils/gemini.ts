import Groq from 'groq-sdk';
import { Message } from '../types';

const DEFAULT_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groqClient: Groq | null = null;
let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
let currentTopic = '';
let currentLevel = '';

export function initializeGemini(apiKey: string): void {
  groqClient = new Groq({
    apiKey: apiKey || DEFAULT_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

export function setTopicAndLevel(topic: string, level: string): void {
  currentTopic = topic;
  currentLevel = level;
  conversationHistory = [];
}

export function createChatSession(): void {
  if (!groqClient) throw new Error('Groq not initialized');
  conversationHistory = [];
}

function getSystemPrompt(): string {
  return `You are EduGuide, a strict structured learning assistant.
Your ONLY job is to teach "${currentTopic}" at "${currentLevel}" level. Never teach anything else.

STRICT RULES:
- ALWAYS respond in the SAME language the user writes in. If they write in French → French. Arabic → Arabic. English → English. Never switch unless the user switches.
- If the user goes off-topic, politely redirect them back to "${currentTopic}".
- Structure ALL responses with clear numbered steps and examples.
- After each lesson, ask ONE comprehension question before moving to the next lesson.
- Never skip to the next lesson until the user answers correctly.
- If the user answers incorrectly, re-explain with a different example.

LESSON FORMAT:
📘 Lesson [N]: [Title]
[Clear explanation with examples]
❓ Question: [one comprehension question]

FLOW:
1. Present the full course roadmap (all lessons numbered) for "${currentTopic}" at "${currentLevel}" level
2. Start Lesson 1 immediately after the roadmap
3. Wait for user answer before going to Lesson 2
4. Continue until all lessons are done
5. End with a final summary and congratulations`;
}

export async function sendMessage(
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  if (!groqClient) throw new Error('Groq not initialized');

  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const stream = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...conversationHistory,
      ],
      max_tokens: 1500,
      temperature: 0.6,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }

    conversationHistory.push({ role: 'assistant', content: fullResponse });
    return fullResponse;
  } catch (err) {
    console.error('Groq sendMessage error:', err);
    throw err;
  }
}

export async function getInitialGreeting(onChunk: (chunk: string) => void): Promise<string> {
  if (!groqClient) throw new Error('Groq not initialized');

  const prompt = `The user wants to learn "${currentTopic}" at "${currentLevel}" level.
Do the following RIGHT NOW:
1. Create a full numbered course roadmap SPECIFICALLY for "${currentTopic}" at "${currentLevel}" level. Do not use any other topic.
2. Immediately start Lesson 1 of "${currentTopic}".
The topic is "${currentTopic}" and the level is "${currentLevel}". This is mandatory. Do not assume or change the topic.`;

  try {
    const stream = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.6,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }

    conversationHistory.push({ role: 'assistant', content: fullResponse });
    return fullResponse;
  } catch (err) {
    console.error('Groq greeting error:', err);
    throw err;
  }
}

export function resetChat(): void {
  conversationHistory = [];
  groqClient = null;
  currentTopic = '';
  currentLevel = '';
}

export function isInitialized(): boolean {
  return groqClient !== null;
}

export function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\d+\. (.*$)/gim, '<li class="numbered">$1</li>')
    .replace(/^[•\-\*] (.*$)/gim, '<li>$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      return match.includes('class="numbered"')
        ? `<ol>${match}</ol>`
        : `<ul>${match}</ul>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}


export type { Message };