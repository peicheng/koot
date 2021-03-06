const webpack = require('webpack')
const common = require('../common')

const factoryConfig = async ({
    pathRun,
    clientDevServerPort,
}) => {

    // let { RUN_PATH, CLIENT_DEV_PORT, APP_KEY } = opt

    // 此处引用 Webpack dev server 的文件，动态打包更新
    const publicPath = `http://localhost:${clientDevServerPort}/dist`

    return {
        mode: "development",
        target: 'async-node',
        node: {
            __dirname: true
        },
        watch: true,
        output: {
            filename: 'index.js',
            chunkFilename: 'chunk.-_-_-_-_-_-[name]-_-_-_-_-_-.js',
            path: `${pathRun}/${common.outputPath}/server`,
            publicPath: `${publicPath}/`
        },
        plugins: [
            new webpack.DefinePlugin({
                __SPA__: false,
            }),
            new webpack.HotModuleReplacementPlugin({ quiet: true })
        ],
        externals: common.filterExternalsModules(),
    }
}

module.exports = async (opt) => await factoryConfig(opt)
