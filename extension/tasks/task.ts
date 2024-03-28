import { SandboxContext } from "../sandbox/context.js";
import { LocalStorage } from "../storage/localstorage.js";
import { ParseTypescriptFunction, ParseTypescriptFunctionUsage } from "./parser.js";

// TODO: don't use this regex and use the typescript parser instead
const headerCommentRE = /\/\[\s\S]*?\*\/|([^:]|^)\/\/(.*)$/m;

interface Argument {
    name: string;
    type: string;
}

export class Task {
    constructor(
        public readonly description: string,
        public readonly name: string,
        public readonly args: Argument[],
        public readonly retValue: string,
        public readonly code: string,
    ) { }

    private toJavascript() {
        const argNames = this.args.map(arg => arg.name);
        return `async function ${this.name}(${["tab", ...argNames].join(", ")}) {
            ${this.code}
        }`;
    }

    private prepareAllTasksContext() {
        let code: string[] = [];
        for (const task of Task.iterator()) {
            code = [...code, task.toJavascript()];
        }
        return code.join('\n\n');
    }

    static * iterator() {
        for (const file of LocalStorage.iterator()) {
            const key = file.getKey().split('task ')[1];
            if (key) {
                const task = file.getJSON(Task);
                if (task) {
                    yield task;
                }
            }
        }
    }

    static fromCode(code: string) {
        const [f] = ParseTypescriptFunction(code);
        code = code.trim();

        const comment = code.match(headerCommentRE);
        let description = '';
        if (comment) {
            description = comment[2].trim();
        }

        return new Task(
            description.trim(),
            f.name,
            f.args,
            f.retValue,
            f.body
        );
    }

    // TODO: perform validation and drop the any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromJSON(json: any) {
        return new Task(
            json.description,
            json.name,
            json.args,
            json.retValue,
            json.code,
        );
    }

    static getTasksInTypescriptDefinition() {
        let code: string[] = [];
        for (const task of Task.iterator()) {
            const argNames = task.args.map(arg => `${arg.name}: ${arg.type}`);
            code = [...code, `${task.description}\nasync function ${task.name}(${["tab: TabContext", ...argNames].join(', ')}): ${task.retValue};`];
        }
        return code.join('\n');
    }

    findUsage(code: string) {
        const [usage] = ParseTypescriptFunctionUsage(code, this.name);
        if (!usage) {
            return [];
        }
        return usage.args;
    }

    getTypescript() {
        const argNames = this.args.map(arg => `${arg.name}: ${arg.type}`);
        return `// ${this.description}
        async function ${this.name}(tab: TabContext, ${argNames.join(', ')}): ${this.retValue} {
            ${this.code}
        }`;
    }

    run(sandbox: SandboxContext, ...args: unknown[]) {
        const argNames = this.args.map(arg => arg.name);
        const code = `(async (${["tab", ...argNames].join(", ")}) => {
            ${this.code}
        })`;

        return sandbox.eval(`${this.prepareAllTasksContext()}\n${code}`, ...args);
    }

    save(overwrite = false) {
        // save to storage
        if (LocalStorage.exists(`task ${this.name}`) && !overwrite) {
            // TODO: ask the user for a new name
            throw new Error(`Task with name ${this.name} already exists`);
        }
        new LocalStorage(`task ${this.name}`).setJSON(this);
    }
}
