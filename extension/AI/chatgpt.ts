import { ChatGPTAPI, ChatGPTError } from 'chatgpt';
import systemPromptGenerateTaskJson from './system_prompt_generate_task_en.json' with { type: "json" };
import systemPromptFindInTextJson from './system_prompt_find_in_text_en.json' with { type: "json" };
import systemPromptRefactorCodeJson from './system_prompt_refactor_code_en.json' with { type: "json" };
import { Task } from '../tasks/task.js';
import { LocalStorage } from '../storage/localstorage.js';

const systemPromptGenerateTask = systemPromptGenerateTaskJson[0];
const systemPromptFindInText = systemPromptFindInTextJson[0];
const systemPromptRefactorCode = systemPromptRefactorCodeJson[0];

const tripleBacktickRE = /```(typescript|javascript)?(.*)```/s;

export class ChatGPTChat {
    private implementation: ChatGPTAPI;

    constructor(apiKey: string) {
        let fetch = globalThis.fetch;
        if (typeof window !== "undefined") {
            fetch = window.fetch.bind(window);
        }

        this.implementation = new ChatGPTAPI({
            apiKey,
            completionParams: {
                temperature: 0,
                max_tokens: 4096,
                top_p: 0.5,
                model: "gpt-3.5-turbo",
                presence_penalty: 0,
            },
            maxModelTokens: 16_000,
            fetch,
        });
    }

    async llmChat(system: string, prompt: string, retries: number) {
        let response;
        let attempts = 0;
        while (attempts < retries) {
            try {
                response = await this.implementation.sendMessage(prompt, { systemMessage: system });
                break;
            } catch (e) {
                if (e instanceof ChatGPTError && (e.statusCode ?? 200) >= 500) {
                    attempts++;
                    console.error(`Error in attempt ${attempts}: ${e.message}`);
                } else {
                    throw e;
                }
            }
        }

        if (!response) {
            throw new Error(`Failed to get a response from the API after ${retries} attempts`);
        }

        if (DEBUG) {
            const debugInfo = {
                system,
                prompt,
                response: response.text,
            };

            // chat-debug-datetime
            new LocalStorage(`chatgpt-debug-${new Date().toISOString()}`).setJSON(debugInfo);
        }

        return response.text;
    }

    async generateStepCode(previousSteps: string[], lastStep: string, currentCode: string) {
        const typescriptTasks = Task.getTasksInTypescriptDefinition();
        let systemPrompt = systemPromptGenerateTask;
        if (typescriptTasks.length) {
            const userSavedTasks = "Additionally use these user defined tasks:\n```typescript" + typescriptTasks + "```";
            systemPrompt = `${systemPromptGenerateTask}\n\n${userSavedTasks}`;
        }

        // The steps preceeded by a number and a dot
        const userPrompt = `
        Steps:
        ${previousSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
        
        Next step:
        ${lastStep}
        
        Current code:
        \`\`\`typescript
        ${currentCode}
        \`\`\`
        `
        const result = await this.llmChat(systemPrompt, userPrompt, 3);

        if (result.match(tripleBacktickRE)) {
            return result.match(tripleBacktickRE)![2];
        } else {
            return result;
        }
    }

    async findInText(query: string, text: string) {
        const systemPrompt = systemPromptFindInText;
        const userPrompt = query + "\n\n```\n" + text + "\n```";
        const result = await this.llmChat(systemPrompt, userPrompt, 3);

        if (result.match(tripleBacktickRE)) {
            return result.match(tripleBacktickRE)![2];
        } else {
            return result;
        }
    }

    async refactorCode(code: string) {
        const systemPrompt = systemPromptRefactorCode;
        const userPrompt = "```typescript\n" + code + "\n```";
        const result = await this.llmChat(systemPrompt, userPrompt, 3);

        if (result.match(tripleBacktickRE)) {
            return result.match(tripleBacktickRE)![2];
        } else {
            return result;
        }
    }
}
