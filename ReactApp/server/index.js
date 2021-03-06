// 初始化环境变量
// require('../../utils/init-node-env')()

// 处理 es6\es7
// require('babel-core/register')
// require('babel-polyfill')

// 前后端同构使用统一的 fetch 数据方式
require('isomorphic-fetch')

// 告诉配置文件，当前运行环境不是webpack
// /config/apps/ 这里的server属性用到的
global.NOT_WEBPACK_RUN = true

// 

const fs = require('fs-extra')
const getPathnameDevServerStart = require('../../utils/get-pathname-dev-server-start')

//

import App from './app'

import kootServer from './run'
import {
    name,
    // dir,
    template,
    router,
    redux,
    // store,
    client,
    server,
} from '__KOOT_PROJECT_CONFIG_PATHNAME__'
import { publicPathPrefix } from '../../defaults/webpack-dev-server'
// } from '../../../../koot'

const {
    cookieKeys,
} = server

// 设置服务器端口
if (typeof process.env.SERVER_PORT === 'undefined' && typeof __SERVER_PORT__ !== 'undefined')
    process.env.SERVER_PORT = __SERVER_PORT__
const port = process.env.SERVER_PORT
// console.log('process.env.SERVER_PORT', process.env.SERVER_PORT)
// console.log('__SERVER_PORT__', __SERVER_PORT__)
// console.log('port', port)

// const serverConfig = require('../config/system')
const appObj = new App()
const app = appObj.instance()

/* 公用的koa配置 */
app.keys = cookieKeys || 'koot';

if (global.kootTest || (process.env.KOOT_TEST_MODE && JSON.parse(process.env.KOOT_TEST_MODE))) {
    console.log(JSON.stringify({
        'koot-test': true,
        'process.env.SERVER_PORT': process.env.SERVER_PORT,
        __SERVER_PORT__,
        port,
        app,
    }))
}

(async () => {
    await kootServer(app, {
        name,
        // dir,
        template,
        router,
        redux,
        // store,
        client,
        server,
    }).catch(err => {
        console.trace(err)
    })
})();

if (__DEV__) {
    const Koa = require('koa')
    const mount = require('koa-mount')
    const proxy = require('koa-better-http-proxy')
    const proxyServer = new Koa()
    const getWDSport = require('../../utils/get-webpack-dev-server-port')
    const port = getWDSport()
    proxyServer.use(proxy('localhost', {
        port,
        userResDecorator: function (proxyRes, proxyResData, ctx) {
            const data = proxyResData.toString('utf8')

            if (/\ufffd/.test(data) === true)
                return proxyResData

            const origin = ctx.origin.split('://')[1]
            return data
                .replace(
                    /:\/\/localhost:([0-9]+)/mg,
                    `://${origin}/${publicPathPrefix}`
                )
                .replace(
                    new RegExp(`://${origin}/${publicPathPrefix}/sockjs-node/`, 'mg'),
                    `://localhost:${port}/sockjs-node/`
                )
        }
    }))
    app.use(mount(`/${publicPathPrefix}`, proxyServer))
}

/* 系统运行 */
appObj.run(port)

setTimeout(() => {
    if (__DEV__) {
        console.log(`\x1b[32m√\x1b[0m ` + `\x1b[93m[koot/server]\x1b[0m started on \x1b[32m${'http://localhost:' + port}\x1b[0m`)
        fs.writeFileSync(
            getPathnameDevServerStart(),
            ' ',
            'utf-8'
        )
    } else {
        console.log(`\x1b[32m√\x1b[0m ` + `\x1b[93m[koot/server]\x1b[0m listening port \x1b[32m${port}\x1b[0m`)
    }
    console.log(' ')
})
