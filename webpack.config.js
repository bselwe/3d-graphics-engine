const path = require("path");
const webpack = require("webpack");

const HtmlPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const deployDir = process.env.DEPLOY_DIR ? process.env.DEPLOY_DIR : __dirname;

module.exports = {
    entry: [
        "./ts/index.ts",
        "./styles/app.sass"
    ],

    output: {
        path: path.join(deployDir, "dist"),
        filename: "bundle.js",
        publicPath: "/"
    },

    devtool: "eval-source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },

    plugins: [
        new HtmlPlugin({
            template: path.join(__dirname, "index.html")
        }),
        new ExtractTextPlugin({ 
            filename: "styles.css", 
            allChunks: true 
        })
    ],

    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                enforce: "pre",
                loader: "tslint-loader",
                options: {
                    failOnHint: true,
                    configFile: "./tslint.json"
                }
            },
            {
                test: /\.(ts|tsx)?$/,
                loader: "awesome-typescript-loader",
                exclude: path.resolve(__dirname, "node_modules"),
                include: path.resolve(__dirname, "ts"),
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader", use: "css-loader",
                })
            },
            {
                test: /\.sass$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader", use: "css-loader!sass-loader",
                })
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ]
    }
};