## 0.6.1
**2018-10-29**
- 错误修正
  - 修复打包时将 webpack 配置写入 log 文件的过程中的一处错误

## 0.6.0
**2018-10-29**
- 核心
  - 新的配置方式 `koot.config.js`
    - 整合原有的 `koot.js` 和 `koot.build.js`
    - 原有配置方式依旧可用
    - 请参照模板项目了解新的配置文件内容和写法
  - 项目配置
    - `redux` 新增可选配置项 `store`
      - 项目自创建的 Redux store。提供该对象时，`redux.combineReducers` 配置项会被忽略
  - 开发模式
    - 启用 `babel-loader` 的缓存，加速热更新的响应速度
- React
  - 路由 (router) 移除配置外层包裹的空层级
  - 模板 (`ejs`)
    - 新语法
      - `content(文件名)`
<br>输出对应文件的文件内容到 HTML 代码中，如 `content('critical.css')` 会读取打包结果中的 `critical.css` 并渲染到 HTML 代码中
      - `pathname(文件名)`
<br>输出对应文件的访问地址到 HTML 代码中，如 `pathname('critical.css')` 会将打包结果中 `critical.css` 的 URL 访问地址渲染到 HTML 代码中
    - 如果模板文件中针对 `critical` 使用上述新语法，则 `styles` 和 `scripts` 两个注入内容中不会出现 `critical` 的相关内容
    - 模板项目已更新，可供参考
- React 同构
  - 生产 (`prod`) 环境开启渲染缓存，缓存默认存在 **5秒**
- `sp-css-loader`
  - 开发模式下启用CSS样式名可读性规则：CSS样式名以 `.[class]__component` 方式命名时，DOM 上的样式名会变为类似 `.nav__a8c0` 的结果
- 更新依赖包
  - `react` -> _16.6.0_
  - `react-dom` -> _16.6.0_
  - `react-redux` -> _5.1.0_
  - `webpack` -> _4.23.1_
  - `webpack-dev-server` -> _3.1.10_
  - `copy-webpack-plugin` -> _4.5.4_
  - `autoprefixer` -> _9.3.1_

## 0.5.5
**2018-10-15**
- 核心
  - Webpack
    - `less-loader` 默认开启 Javascript 选项 (`javascriptEnabled`)

## 0.5.4
**2018-10-15**
- React
  - 移除根层 `#root` 下的额外 `<div>`

## 0.5.2
**2018-10-12**
- React
  - 高阶组件 `extend`
    - `data` 可传入 _Function_，作为传统的 `data.fetch`
      - 该情况下，数据检查操作建议写在 redux action 中
    - `data.fetch` 可传入 _Array_，核心代码会自动执行 `Promise.all()`

## 0.5.1
**2018-10-11**
- 错误修正
  - `pageinfo` 移除已有 `meta` 标签时遇到 `undefined` 时全局报错的问题

## 0.5.0
**2018-10-11**
- 核心
  - 为避免版本冲突，将所有 NPM 依赖包的版本改为固定版本
- 开发模式 (`koot-dev`)
  - 新的命令选项 `--no-open`：禁用自动打开浏览器
  - 针对 React 组件自动启用热更新
    - 注意事项请参见文档的 [React组件热更新](https://koot.js.org/react-hmr) 章节
- React同构 (`ReactApp`)
  - 新的高阶组件 `extend`
    - `import { extend } from 'koot'`
    - 可作为组件装饰器使用
    - 提供同构数据功能
    - 包含 `pageinfo` 和 `ImportStyle` 功能
    - 具体用法请参见文档的 [React高阶组件](https://koot.js.org/react-hoc) 章节
  - 优化 CSS 处理相关流程
  - 开发模式
    - 页面可访问静态资源文件目录中的内容
- 错误修正
  - 浏览器环境 (`__CLIENT__`) 中使用 `utils/get-port` 方法无结果的问题

## 0.4.3
**2018-09-18**
- **ReactApp** (React同构)
  - 开发模式：重写可使用本机 IP 地址访问的功能，现在会适应更多场景

## 0.4.2
**2018-09-18**
- 打包配置 (`/koot.build.js`)
  - 新增选项：`staticAssets`
    - 静态资源文件存放路径，打包时会自动复制该目录下的所有文件到打包目录下，方便直接使用

## 0.4.1
**2018-09-17**
- `koot-analyze` 命令现在不会生成 `service-worker` 文件
- **ReactApp** (React同构)
  - 开发模式：可使用本机 IP 地址访问

## 0.4.0
**2018-09-17**
- 启用命令: `koot-analyze`

## 0.3.2
**2018-09-14**
- 错误修正
  - 开发模式不会实时响应语言包文件更新的问题

## 0.3.1
**2018-09-14**
- 错误修正
  - 开发模式不断重启的问题

## 0.3.0
**2018-09-14**
- **ReactApp** (React同构)
  - 当多语言（i18n）启用时，在 `<head>` 中自动生成跳转到相应的其他语种的链接的 `<link>` 标签
- 内部代码
  - `hl` 修改为全局常量

## 0.2.4
**2018-09-14**
- 依赖库
  - 添加：`@babel/plugin-syntax-dynamic-import`

## 0.2.3
**2018-09-12**
- 生成 Webpack 配置
  - 完善：忽略值为 `null` `undefined` 等空值的插件项

## 0.2.2
**2018-09-12**
- 生成 Webpack 配置
  - 忽略值为 `null` `undefined` 等空值的插件项

## 0.2.1
**2018-09-11**
- 错误修正
  - 启动开发模式时生成名为 `1.json` 文件的问题

## 0.2.0
**2018-09-10**
- 更新 `babel` 至 v7
- 新增单元测试
  1. 生成 Webpack 配置
  2. Webpack 打包流程

## 0.1.0
**2018-08-24**
- 更名至 `koot`
- 重置版本号

----

更名至 `koot`

----

## 3.0.7-alpha.31
**2018-06-19**
- 可直接通过 `super-project` 载入内容
  - 用法示例：`import { store, history } from 'super-project'`)
  - 当前可用内容
    - `store` - Redux store
    - `history` - 路由与历史记录对象，包含 `push`、`replace` 等方法
    - `localeId` - (仅在 i18n 开启时可用) 当前语种ID
    - `pageinfo` - (原 `super-ui-page`) 更新页面 `title` 和 `meta` 的装饰器
- 移除 `super-ui-page` 依赖
  - 原有的 `superPage` 移动到 `super-project` 主包中
  - 更名为 `pageinfo`

## 2.4.0
2018-02-11
  - 新增文件 `CHANGELOG.md`
  - 更新依赖库
  - `sp-isomorphic-utils`
    - `getFile`: 如果根据文件名直接匹配到目标文件，直接返回该文件名，不再继续进行文件夹内过滤
  - `sp-pwa`
    - `create`: 创建 service-worker 时，新增参数 `outputFilenameHash`，表示创建的 sw 文件名中带有 hash，默认为 `false`
      - 当前的 service-worker 规范中，浏览器不会对 sw 文件进行缓存，每次访问页面时都会尝试重新获取 sw 文件
    - `get-service-worker-file`: 更新到最新的 `getFile()` 方法
