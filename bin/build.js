#!/usr/bin/env node

const fs = require('fs-extra')
const program = require('commander')
const chalk = require('chalk')

const { keyFileProjectConfigTemp } = require('../defaults/before-build')

const __ = require('../utils/translate')
// const readBuildConfigFile = require('../utils/read-build-config-file')
const sleep = require('../utils/sleep')
const setEnvFromCommand = require('../utils/set-env-from-command')
const validateConfig = require('../libs/validate-config')

const kootBuild = require('../core/webpack/enter')

program
    .version(require('../package').version, '-v, --version')
    .usage('[options]')
    .option('-c, --client', 'Set STAGE to CLIENT')
    .option('-s, --server', 'Set STAGE to SERVER')
    .option('--stage <stage>', 'Set STAGE')
    .option('--env <env>', 'Set ENV')
    .option('--dest <destination-path>', 'Set destination directory')
    .option('--config <config-file-path>', 'Set config file pathname')
    .option('--type <project-type>', 'Set project type')
    .option('--koot-test', 'Koot test mode')
    .parse(process.argv)

/**
 * 执行打包
 */
const run = async () => {

    // 清空 log
    process.stdout.write('\x1B[2J\x1B[0f')

    const {
        client, server,
        stage: _stage,
        env = 'prod',
        config,
        type,
        dest,
        kootTest = false
    } = program
    // console.log(program)

    setEnvFromCommand({
        config,
        type,
    })

    process.env.KOOT_TEST_MODE = JSON.stringify(kootTest)

    const stage = _stage ? _stage : (client ? 'client' : (server ? 'server' : false))

    // TODO: 

    // console.log(stage, env)

    // if (!stage) {
    //     console.log(
    //         chalk.redBright('× ')
    //         + __('build.missing_option', {
    //             option: chalk.yellowBright('stage'),
    //             example: 'koot-build ' + chalk.green('--stage client') + ' --env prod',
    //             indent: '  '
    //         })
    //     )
    //     return
    // }

    // if (!env) {
    //     console.log(
    //         chalk.redBright('× ')
    //         + __('build.missing_option', {
    //             option: chalk.yellowBright('env'),
    //             example: 'koot-build ' + chalk.green('--env prod'),
    //             indent: '  '
    //         })
    //     )
    //     return
    // }

    // 在所有操作执行之前定义环境变量
    process.env.WEBPACK_BUILD_STAGE = stage || 'client'
    process.env.WEBPACK_BUILD_ENV = env

    // 读取构建配置
    const buildConfig = await validateConfig()
    // const buildConfig = await readBuildConfigFile()
    // const {
    //     server: hasServer
    // } = buildConfig

    if (dest) buildConfig.dist = dest

    // 如果提供了 stage，仅针对 stage 执行打包
    if (stage) {
        // if (stage === 'server' && !hasServer) {
        //     console.log(chalk.redBright('× '))
        // }
        await kootBuild(buildConfig)
        await after(buildConfig)
        console.log(' ')
        return
    }

    // 如过没有提供 stage，自动相继打包 client 和 server
    await kootBuild({ ...buildConfig })
    await sleep(100)

    // if (!hasServer) return

    console.log('\n' + ''.padEnd(60, '=') + '\n')
    process.env.WEBPACK_BUILD_STAGE = 'server'
    await kootBuild({ ...buildConfig })
    await sleep(100)

    console.log('\n' + ''.padEnd(60, '=') + '\n')
    console.log(
        chalk.green('√ ')
        + chalk.yellowBright('[koot/build] ')
        + __('build.complete', {
            time: (new Date()).toLocaleString()
        })
    )

    await after(buildConfig)
    console.log(' ')
}

const after = async (config = {}) => {
    const ENV = process.env.WEBPACK_BUILD_ENV

    const {
        [keyFileProjectConfigTemp]: fileProjectConfigTemp
    } = config

    // 移除临时配置文件
    if (ENV === 'prod' && fileProjectConfigTemp) {
        await fs.remove(fileProjectConfigTemp)
    }
}

run()
