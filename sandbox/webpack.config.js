import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const module = {
    entry: './sandbox/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        extensionAlias: {
            '.js': ['.ts', '.js'],
        },
        fallback: {
            crypto: false,
             fs: false,
            // path: false,
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../dist/sandbox'),
    },
};

export default module;