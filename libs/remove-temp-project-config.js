const fs = require('fs-extra')
const path = require('path')
const glob = require('glob-promise')

const { filenameProjectConfigTemp } = require('../defaults/before-build')
const getCwd = require('../utils/get-cwd')

/**
 * @async
 * 移除所有根目录下的临时项目配置文件
 */
module.exports = async (cwd = getCwd()) => {
    const files = await glob(path.resolve(cwd, filenameProjectConfigTemp), {
        dot: true
    })

    for (let file of files) {
        await fs.remove(file)
    }
}
