import { Tab } from "../browser/browser.js";
import { SandboxContext } from "../sandbox/context.js";

// TODO: replace this regex with a parser, won't work if one of the argument is a function, for example
// async function name(f: () => void) ...
const functionHeaderRE = /(async)?\s*function\s*([a-zA-Z0-9]+)\s*\(([^)]*)\)\s*/s;
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

    static fromCode(code: string) {
        code = code.trim();
        const header = code.match(functionHeaderRE);
        if (!header) {
            throw new Error('Invalid function header');
        }

        const [, , name, args] = header;

        const argsList = args.split(',').map(arg => {
            const [name, type] = arg.trim().split(':');
            return { name, type: type ?? 'any' };
        });

        const body = code.match(bodyRE);
        if (!body) {
            throw new Error('Invalid function body');
        }

        const [, codeBody] = body;

        return new Task(
            `Task generated from code: ${code}`,
            name,
            argsList,
            'any',
            codeBody,
        );
    }

    run(sandbox: SandboxContext, ...args: string[]) {
        const argNames = this.args.map(arg => arg.name);
          const code = `(async (${(["tab", ...argNames]).join(", ")}) => {
            ${this.code}
        })`;

        sandbox.eval(code, ...args);
    }
}