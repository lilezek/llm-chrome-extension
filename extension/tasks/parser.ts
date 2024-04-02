import typescript from 'typescript';
import { debug } from '../debug.js';

type SerializableType = string | number | boolean | null | SerializableType[] | { [key: string]: SerializableType };

function SerializeValue(value: typescript.Expression): SerializableType {
    // Check if it is a primitive value
    if (typescript.isStringLiteral(value)) {
        return value.text;
    } else if (typescript.isNumericLiteral(value)) {
        return Number(value.text);
    } else if (value.getText() === 'null') {
        return null;
    } else if (value.getText() === 'true') {
        return true;
    } else if (value.getText() === 'false') {
        return false;
    } else if (typescript.isArrayLiteralExpression(value)) {
        return value.elements.map(e => SerializeValue(e));
    } else if (typescript.isObjectLiteralExpression(value)) {
        const obj: { [key: string]: SerializableType } = {};
        for (const prop of value.properties) {
            if (typescript.isPropertyAssignment(prop)) {
                obj[prop.name.getText()] = SerializeValue(prop.initializer);
            }
        }
        return obj;
    } else {
        return value.getText();
    }
}

/**
 * Returns arguments, name, return value and body of every function declared in the code.
 */
export function ParseTypescriptFunction(code: string) {
    const source = typescript.createSourceFile(
        'task.ts',
        code,
        typescript.ScriptTarget.Latest,
        true,
        typescript.ScriptKind.TS,
    );

    const tasks: {
        name: string,
        args: { name: string, type: string }[],
        retValue: string,
        body: string,
    }[] = [];

    function visit(node: typescript.Node) {
        // Find function declarations
        if (typescript.isFunctionDeclaration(node)) {
            const name = node.name?.getText() ?? 'anonymous';
            const args = node.parameters.filter(a => {
                // Filter out the tab argument either by name (tab) or by type (TabContext)
                return a.name?.getText() !== 'tab' && a.type?.getText() !== 'TabContext';
            }).map(p => {
                return {
                    name: p.name.getText(),
                    type: p.type?.getText() ?? 'any',
                };
            });
            const retValue = node.type?.getText() ?? 'Promise<any>';
            const body = node.body?.getText() ?? '';

            tasks.push({
                name,
                args,
                retValue,
                body,
            });
        }
        typescript.forEachChild(node, visit);
    }

    visit(source);

    debug.log(tasks);

    return tasks;
}

/**
 * Finds function calls with the specified function name and returns their arguments.
 */
export function ParseTypescriptFunctionUsage(code: string, functionName: string) {
    const source = typescript.createSourceFile(
        'task.ts',
        code,
        typescript.ScriptTarget.Latest,
        true,
        typescript.ScriptKind.TS,
    );

    const tasks: {
        args: (SerializableType)[],
    }[] = [];

    function visit(node: typescript.Node) {
        // Find function calls with the specified function name
        if (typescript.isCallExpression(node)) {
            const callName = node.expression.getText();
            if (callName === functionName) {
                const args = node.arguments.filter((a) => {
                    // Filter out the tab argument
                    return a.getText() !== 'tab';
                }).map(a => {
                    // Serialize the argument
                    return SerializeValue(a);
                });
                tasks.push({
                    args,
                });
            }
        }
        typescript.forEachChild(node, visit);
    }

    visit(source);

    debug.log(tasks);

    return tasks;
}

/**
 * Transforms typescript code to replace variable declarations with 
 * window.variableName = variableValue;
 */
export function TransformVariablesIntoGlobals(code: string) {
    const source = typescript.createSourceFile(
        'task.ts',
        code,
        typescript.ScriptTarget.Latest,
        true,
        typescript.ScriptKind.TS,
    );

    const printer = typescript.createPrinter();

    function visit(node: typescript.Node): typescript.Node {
        if (typescript.isVariableDeclarationList(node)) {
            const declarations = node.declarations;
            const expressions = declarations.map(d => {
                const variableName = d.name.getText();
                const initializer = d.initializer;
                if (initializer) {
                    return typescript.factory.createAssignment(
                        typescript.factory.createPropertyAccessExpression(
                            typescript.factory.createIdentifier('window'),
                            typescript.factory.createIdentifier(variableName),
                        ),
                        initializer
                    );
                }
            }).filter(e => e !== undefined) as typescript.Expression[];

            return typescript.factory.createCommaListExpression(expressions)
        }
        return typescript.visitEachChild(node, visit, undefined);
    }

    const result = typescript.visitNode(source, visit);
    const transformedCode = printer.printNode(typescript.EmitHint.Unspecified, result, source);

    return transformedCode;
}