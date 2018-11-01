process.env.DO_WEBPACK = true

//
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const __ = require('../../utils/translate')
const spinner = require('../../utils/spinner')
const getDistPath = require('../../utils/get-dist-path')
const getAppType = require('../../utils/get-app-type')
const getCwd = require('../../utils/get-cwd')

const log = require('../../libs/log')
const elapse = require('../../libs/elapse.js')

const createWebpackConfig = require('./config/create')
const createPWAsw = require('../pwa/create')

const afterServerProd = require('./lifecyle/after-server-prod')
const cleanAndWriteLogFiles = require('./lifecyle/before/clean-and-write-log-files')

const validateWebpackDevServerPort = require('./config/validate-webpack-dev-server-port')
const validateDist = require('./config/validate-dist')

const {
    filenameWebpackDevServerPortTemp,
    keyFileProjectConfigTemp,
    keyConfigQuiet,
} = require('../../defaults/before-build')


// 调试webpack模式
// const DEBUG = 1

// 程序启动路径，作为查找文件的基础
const RUN_PATH = getCwd()

// 初始化环境变量
require('../../utils/init-node-env')()

// 用户自定义系统配置
// const SYSTEM_CONFIG = require('../../config/system')
// const DIST_PATH = require('')

process.env.DO_WEBPACK = false

/**
 * Webpack 运行入口方法
 * @async
 * @param {Object} kootConfig
 * @param {Boolean} [kootConfig.analyze=false] 是否为打包分析（analyze）模式
 * @returns {Object}
 */
module.exports = async (kootConfig = {}) => {
    /**
     * @type {Object} 返回结果
     * @property {Boolean|Error[]} errors 发生的错误对象
     * @property {Boolean|String[]} warnings 发生的警告内容
     * @property {Function} addError 添加错误
     * @property {Function} addWarning 添加警告
     */
    const result = {
        errors: false,
        warnings: false,
    }
    Object.defineProperties(result, {
        addError: {
            value: (err) => {
                if (!Array.isArray(result.errors))
                    result.errors = []
                result.errors.push(!(err instanceof Error) ? new Error(err) : err)
            },
        },
        addWarning: {
            value: (warning) => {
                if (!Array.isArray(result.warnings))
                    result.warnings = []
                result.warnings.push(warning)
            },
        },
        hasError: {
            value: () => Array.isArray(result.errors),
        },
        hasWarning: {
            value: () => Array.isArray(result.warnings),
        },
    })

    /** @type {Number} 过程开始时间 */
    const timestampStart = Date.now()

    // 抽取配置
    let {
        beforeBuild,
        afterBuild,
        analyze = false,
        [keyConfigQuiet]: quietMode = false,
    } = kootConfig

    // 确定项目类型
    const appType = await getAppType()

    // 确定环境变量
    const {
        WEBPACK_BUILD_TYPE: TYPE,
        WEBPACK_BUILD_ENV: ENV,
        WEBPACK_BUILD_STAGE: STAGE,
        // WEBPACK_DEV_SERVER_PORT,
        KOOT_TEST_MODE,
    } = process.env
    const kootTest = JSON.parse(KOOT_TEST_MODE)

    // DEBUG && console.log('============== Webpack Debug =============')
    // DEBUG && console.log('Webpack 打包环境：', TYPE, STAGE, ENV)
    if (!quietMode)
        log('build', __('build.build_start', {
            type: chalk.cyanBright(appType),
            stage: chalk.green(STAGE),
            env: chalk.green(ENV),
        }))

    const before = async () => {
        // 开发模式
        if (ENV === 'dev') {
            // 确保 server/index.js 存在
            fs.ensureFileSync(path.resolve(getDistPath(), `./server/index.js`))
        }

        if (!quietMode)
            log('callback', 'build', `callback: ` + chalk.green('beforeBuild'))

        if (typeof beforeBuild === 'function') await beforeBuild(data)
    }

    const after = async () => {
        if (!quietMode) console.log(' ')

        if (!analyze && pwa && STAGE === 'client' && ENV === 'prod') {
            // 生成PWA使用的 service-worker.js
            await createPWAsw(pwa, i18n)
        }

        if (STAGE === 'server' && ENV === 'prod') {
            // 生成PWA使用的 service-worker.js
            await afterServerProd(data)
        }

        log('callback', 'build', `callback: ` + chalk.green('afterBuild'))
        if (typeof afterBuild === 'function') await afterBuild(data)

        // 标记完成
        log('success', 'build', __('build.build_complete', {
            type: chalk.cyanBright(appType),
            stage: chalk.green(STAGE),
            env: chalk.green(ENV),
        }))

        // console.log(`  > start: ${timestampStart}`)
        // console.log(`  > end: ${Date.now()}`)
        // console.log(`  > ms: ${Date.now() - timestampStart}`)
        if (!quietMode)
            console.log(`  > ~${elapse(Date.now() - timestampStart)} @ ${(new Date()).toLocaleString()}`)

        return
    }

    // ========================================================================
    //
    // 最优先流程
    //
    // ========================================================================
    // CLIENT / DEV: 确定 webpack-dev-server 端口号
    if (ENV === 'dev') {
        // 读取已有结果
        const dist = await validateDist(kootConfig.dist)
        const pathnameTemp = path.resolve(dist, filenameWebpackDevServerPortTemp)
        const getExistResult = async () => {
            if (fs.existsSync(pathnameTemp)) {
                const content = await fs.readFile(pathnameTemp)
                if (!isNaN(content))
                    return parseInt(content)
            }
            return undefined
        }
        const existResult = await getExistResult()
        if (existResult) {
            process.env.WEBPACK_DEV_SERVER_PORT = existResult
        } else {
            process.env.WEBPACK_DEV_SERVER_PORT = await validateWebpackDevServerPort(kootConfig.port)
            // 将 webpack-dev-server 端口写入临时文件
            await fs.writeFile(
                pathnameTemp,
                process.env.WEBPACK_DEV_SERVER_PORT,
                'utf-8'
            )
        }
    }

    // ========================================================================
    //
    // 创建对应当前环境的 Webpack 配置
    //
    // ========================================================================
    const data = await createWebpackConfig(Object.assign(kootConfig, {
        afterBuild: after
    })).catch(err => {
        console.error('生成打包配置时发生错误! \n', err)
    })
    const {
        webpackConfig,
        pwa,
        i18n,
        devServer,
        pathnameChunkmap,
    } = data

    if (STAGE === 'client' && TYPE === 'spa') {
        if (!quietMode)
            log('error', 'build',
                `i18n temporarily ` + chalk.redBright(`disabled`) + ` for `
                + chalk.cyanBright('SPA')
            )
    } else if (typeof i18n === 'object') {
        if (STAGE === 'client') {
            if (!quietMode)
                log('success', 'build',
                    `i18n ` + chalk.yellowBright(`enabled`)
                )
            if (!quietMode) console.log(`  > type: ${chalk.yellowBright(i18n.type)}`)
            if (!quietMode) console.log(`  > locales: ${i18n.locales.map(arr => arr[0]).join(', ')}`)
        }
        if (ENV === 'dev' && i18n.type === 'default') {
            if (!quietMode) console.log(`  > We recommend using ${chalk.greenBright('redux')} mode in DEV enviroment.`)
        }
    }

    // ========================================================================
    //
    // 准备开始打包
    //
    // ========================================================================

    await before()

    const spinnerBuilding = (!kootTest && !quietMode)
        ? spinner(chalk.yellowBright('[koot/build] ') + __('build.building'))
        : undefined
    const buildingComplete = () => {
        if (spinnerBuilding) {
            if (result.hasError()) {
                spinnerBuilding.fail()
            } else {
                spinnerBuilding.stop()
            }
        }
    }

    /**
     * 打包过程出错处理
     * @param {Error|String} err 
     */
    const buildingError = (err) => {
        // 移除过程中创建的临时文件
        const pathnameTemp = path.resolve(data.dist, data[keyFileProjectConfigTemp])
        if (fs.existsSync(pathnameTemp))
            fs.removeSync(pathnameTemp)

        // 将错误添加入结果对象
        result.addError(err)

        // 返回结果对象
        return result
    }

    // 处理记录文件
    await cleanAndWriteLogFiles(webpackConfig, {
        quietMode
    })

    // if (Array.isArray(webpackConfig)) {
    //     webpackConfig.forEach(config => console.log(config.module.rules))
    // } else {
    //     console.log(webpackConfig.module.rules)
    // }

    // 客户端开发模式
    if (STAGE === 'client' && ENV === 'dev') {
        const compiler = webpack(webpackConfig)
        const devServerConfig = Object.assign({
            quiet: false,
            stats: { colors: true },
            hot: true,
            inline: true,
            historyApiFallback: true,
            contentBase: './',
            publicPath: TYPE === 'spa' ? '/' : '/dist/',
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            open: TYPE === 'spa',
        }, devServer)
        const port = TYPE === 'spa' ? process.env.SERVER_PORT : process.env.WEBPACK_DEV_SERVER_PORT

        // more config
        // http://webpack.github.io/docs/webpack-dev-server.html
        const server = await new WebpackDevServer(compiler, devServerConfig)
        server.use(require('webpack-hot-middleware')(compiler))
        server.listen(port, '0.0.0.0', async (err) => {
            if (err) console.error(err)
            buildingComplete()
            // await after()
        })
    }

    // 客户端打包
    if (STAGE === 'client' && ENV === 'prod') {
        await fs.ensureFile(pathnameChunkmap)
        await fs.writeJson(
            pathnameChunkmap,
            {},
            {
                spaces: 4
            }
        )
        // process.env.NODE_ENV = 'production'

        // 执行打包
        const build = async (config, onComplete = buildingComplete) => {
            const compiler = webpack(config)
            // console.log('compiler')
            await new Promise((resolve, reject) => {
                compiler.run(async (err, stats) => {
                    const info = stats.toJson()

                    if (stats.hasWarnings()) {
                        result.addWarning(info.warnings)
                    }

                    if (stats.hasErrors()) {
                        onComplete()
                        console.log(stats.toString({
                            chunks: false,
                            colors: true
                        }))
                        reject(`webpack error: [${TYPE}-${STAGE}-${ENV}] ${info.errors}`)
                        return buildingError(info.errors)
                    }

                    if (err) {
                        onComplete()
                        reject(`webpack error: [${TYPE}-${STAGE}-${ENV}] ${err}`)
                        return buildingError(err)
                    }

                    onComplete()

                    // 非分析模式: log stats
                    if (!analyze && !quietMode) {
                        console.log(stats.toString({
                            chunks: false, // 输出精简内容
                            colors: true
                        }))
                    }

                    setTimeout(() => resolve(), 10)
                })
            })
        }

        if (Array.isArray(webpackConfig)) {
            buildingComplete()
            // console.log(' ')
            // let index = 0
            for (let config of webpackConfig) {
                const localeId = config.plugins
                    .filter(plugin => typeof plugin.localeId === 'string')
                    .reduce((prev, cur) => cur.localeId)
                const spinnerBuildingSingle = (!kootTest && !quietMode)
                    ? spinner(
                        (chalk.yellowBright('[koot/build] ') + __('build.building_locale', {
                            locale: localeId
                        })).replace(new RegExp(' ' + localeId + '\\)'), ` ${chalk.green(localeId)})`)
                    )
                    : undefined
                await build(config, () => {
                    if (spinnerBuildingSingle) {
                        if (result.hasError()) {
                            spinnerBuildingSingle.fail()
                        } else {
                            spinnerBuildingSingle.stop()
                            setTimeout(() => {
                                console.log(' ')
                                log('success', 'build', chalk.green(`${localeId}`))
                            })
                        }
                    }
                })
                // index++
            }
        } else {
            await build(webpackConfig)
            // console.log(' ')
        }

        await after()
        return result
    }

    // 服务端开发环境
    if (STAGE === 'server' && ENV === 'dev') {
        await webpack(
            webpackConfig,
            async (err, stats) => {
                buildingComplete()

                if (err)
                    throw new Error(`webpack error: [${TYPE}-${STAGE}-${ENV}] ${err}`)

                console.log(stats.toString({
                    chunks: false,
                    colors: true
                }))

                await after()
            }
        )

        return
    }

    // 服务端打包
    if (STAGE === 'server' && ENV === 'prod') {
        // process.env.NODE_ENV = 'production'
        // process.env.WEBPACK_SERVER_PUBLIC_PATH =
        //     (typeof webpackConfigs.output === 'object' && webpackConfigs.output.publicPath)
        //         ? webpackConfigs.output.publicPath
        //         : ''

        // 确定 chunkmap
        // 如果没有设定，创建空文件
        if (!fs.pathExistsSync(pathnameChunkmap)) {
            await fs.ensureFile(pathnameChunkmap)
            process.env.WEBPACK_CHUNKMAP = ''
            // console.log(chalk.green('√ ') + chalk.greenBright('Chunkmap') + ` file does not exist. Crated an empty one.`)
        } else {
            try {
                process.env.WEBPACK_CHUNKMAP = JSON.stringify(await fs.readJson(pathnameChunkmap))
            } catch (e) {
                process.env.WEBPACK_CHUNKMAP = ''
            }
        }

        await new Promise((resolve, reject) => {
            webpack(webpackConfig, async (err, stats) => {
                const info = stats.toJson()

                if (stats.hasWarnings()) {
                    result.addWarning(info.warnings)
                }

                if (stats.hasErrors()) {
                    buildingComplete()
                    console.log(stats.toString({
                        chunks: false,
                        colors: true
                    }))
                    reject(`webpack error: [${TYPE}-${STAGE}-${ENV}] ${info.errors}`)
                    return buildingError(info.errors)
                }

                if (err) {
                    buildingComplete()
                    reject(`webpack error: [${TYPE}-${STAGE}-${ENV}] ${err}`)
                    return buildingError(err)
                }

                buildingComplete()
                if (!quietMode) console.log(' ')

                if (!analyze && !quietMode)
                    console.log(stats.toString({
                        chunks: false, // Makes the build much quieter
                        colors: true
                    }))

                resolve()
            })
        })

        await after()

        return result
    }

    return result
}
