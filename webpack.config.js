import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import webpack from 'webpack';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const module = {
    mode: 'development',
    entry: './extension/main.ts',
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
            buffer: "buffer",
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/extension'),
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
            },
            'DEBUG': 'true',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ],
    devtool: 'cheap-module-source-map'
};

export default module;