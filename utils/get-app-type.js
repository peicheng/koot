const fs = require('fs')
const path = require('path')

const pathname = path.resolve(__dirname, '../../../super.js')

module.exports = () => {
    try {
        const { type } = require(pathname)
        return type
    } catch (e) { }

    const content = fs.readFileSync(pathname, 'utf-8')
    const matches = /type[ ]*=[ ]*['"](.+?)['"]/gm.exec(content)
    if (Array.isArray(matches) && matches.length > 1)
        return matches[1]

    return undefined
}