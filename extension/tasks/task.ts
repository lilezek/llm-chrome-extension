import { SandboxContext } from "../sandbox/context.js";
import { LocalStorage } from "../storage/localstorage.js";

// TODO: replace this regex with a parser, won't work if one of the argument is a function, for example
// async function name(f: () => void) ...
const headerCommentRE = /\/\[\s\S]*?\*\/|([^:]|^)\/\/(.*)$/m;
const functionHeaderRE = /(async)?\s*function\s*([a-zA-Z0-9]+)\s*\(([^)]*)\)\s*(:([^{]*))?/s;
const bodyRE = /{(.*)}/s;

interface Argument {
    name: string;
    type: string;
}

export class Task {
    constructor(
        private description: string,
        private name: string,
        private args: Argument[],
        private retValue: string,
        private code: string,
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
        code = code.trim();

        const comment = code.match(headerCommentRE);
        let description = '';
        if (comment) {
            description = comment[2].trim();
        }

        const header = code.match(functionHeaderRE);
        if (!header) {
            throw new Error('Invalid function header');
        }

        const [, , name, args, , retType = ""] = header;

        const argsList = args.split(',').map(arg => {
            const [name, type] = arg.trim().split(':');
            return { name: name.trim(), type: type?.trim() ?? 'any' };
        })
        // Filter the tab argument to avoid duplicates
        .filter(arg => arg.name != "tab");

        const body = code.match(bodyRE);
        if (!body) {
            throw new Error('Invalid function body');
        }

        const [, codeBody] = body;

        return new Task(
            description.trim(),
            name.trim(),
            argsList,
            retType.trim() || 'Promise<any>',
            codeBody.trim(),
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

    getTypescript() {
        const argNames = this.args.map(arg => `${arg.name}: ${arg.type}`);
        return `// ${this.description}
        async function ${this.name}(tab: TabContext, ${argNames.join(', ')}): ${this.retValue} {
            ${this.code}
        }`;
    }

    run(sandbox: SandboxContext, ...args: string[]) {
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
