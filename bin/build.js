#!/usr/bin/env node

const program = require('commander')
const readBuildConfigFile = require('../utils/read-build-config-file')
const sleep = require('../utils/sleep')
const superBuild = require('../core/webpack/enter')

program
    .version(require('../package').version, '-v, --version')
    .usage('[options]')
    .option('-c, --client', 'Set STAGE to CLIENT')
    .option('-s, --server', 'Set STAGE to SERVER')
    .option('--stage [stage]', 'Set STAGE')
    .option('--env [env]', 'Set ENV')
    .parse(process.argv)

const run = async () => {
    const {
        client, server,
        stage: _stage,
        env = 'prod',
    } = program

    const stage = _stage ? _stage : (client ? 'client' : (server ? 'server' : false))

    // console.log(stage, env)

    // if (!stage) {
    //     console.log(
    //         chalk.red('× ')
    //         + __('build.missing_option', {
    //             option: chalk.yellowBright('stage'),
    //             example: 'super-build ' + chalk.green('--stage client') + ' --env prod',
    //             indent: '  '
    //         })
    //     )
    //     return
    // }

    // if (!env) {
    //     console.log(
    //         chalk.red('× ')
    //         + __('build.missing_option', {
    //             option: chalk.yellowBright('env'),
    //             example: 'super-build ' + chalk.green('--env prod'),
    //             indent: '  '
    //         })
    //     )
    //     return
    // }

    // 在所有操作执行之前定义环境变量
    process.env.WEBPACK_BUILD_STAGE = stage || 'client'
    process.env.WEBPACK_BUILD_ENV = env

    // 读取构建配置
    const buildConfig = await readBuildConfigFile()

    // 如果提供了 stage，仅针对 stage 执行打包
    if (stage) return await superBuild(buildConfig)

    // 如过没有提供 stage，自动相继打包 client 和 server
    await superBuild({ ...buildConfig })
    await sleep(100)

    console.log('\n' + ''.padEnd(60, '=') + '\n')

    process.env.WEBPACK_BUILD_STAGE = 'server'
    await superBuild({ ...buildConfig })
    await sleep(100)
}

run()