# Chrome-extension-tools

## 简介

封装了日常开发一动化浏览器插件时所用到的组件，比如工作流配置、接口拦截、消息通知、日志和一些工具函数等。

## 主要特点

1. 工作流自动化：实现复杂业务流程的自动化，支持多层级任务定义、循环和重新执行功能
2. 消息通信：简化 Background、Content Script 和 Side Panel 之间的消息传递
3. 请求拦截：获取页面的请求
4. 日志模块：统一日志定义，方便后续的拓展
5. 类型支持：完整的TypeScript类型定义

## 适用场景

1. 自动化执行网页操作
2. 获取网页应用的数据

## 工作流的使用

工作流模块是为实现复杂业务流程自动化设计的核心组件，以 Side Panel 为核心，通知 Content Script 或 Background 来执行相关动作。

### 快速使用

#### 初始化

Background:

```typescript
import { initBGMsgListener, initBackground } from 'chrome-extension-tools'
// 初始化消息通知
initBGMsgListener()
// 初始化基本的消息事件
initBackground()
```

Content Script:

```typescript
// 入口文件
import { initCSMsgListener } from 'chrome-extension-tools'
initCSMsgListener()

// 指定文件初始化，如果只有一个任务的，可以在入口文件初始化
import { initContentScriptTask } from 'chrome-extension-tools'
// 你的工作流配置
import { getTasks } from '~/tasks/index.task'
// 监听 window message 事件，将接口拦截后的数据发送给 bg 和 cs
initContentScriptRequest()
// 初始化工作流
initContentScriptTask(getTasks())
```

Side Panel:

```typescript
import { CetActuator, CetDestination, EVENTS, onMsgInSP, sendMsgBySP } from 'chrome-extension-tools'
// 自定义 logger 对象
import { getTasks, logger } from '~/tasks/index.task'
// 监听接口事件，获取 Content Script 捕获的接口数据
onMsgInSP(EVENTS.CS2SP_GET_REQUEST, async (data) => {
  console.log('data', data)
  return true
})
// 获取当前 Tab 数据
async function getTab() {
  const { data } = await sendMsgBySP<undefined, chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG })
  return data
}
// 执行工作流任务
async function start() {
  logger.info('开始执行')
  // 初始化工作流对象
  const ins = new CetActuator(getTasks(), {
    // 每次执行任务前，工作流模块会执行 getTabId 事件，返回 tabId
    // @ts-ignore
    getTabId: async () => {
      const tab = await getTab()
      return tab ? tab.id : undefined
    },
    taskBeforeCb: (task) => {
      logger.info(`${task.name} 开始执行`)
    },
    taskAfterCb: (task, result) => {
      logger.info(`${task.name} 执行结束 ${result ? '成功' : '失败'}`)
    },
  })
  // 执行工作流
  const result = await ins.run()
  console.log(result)
  logger.info('全流程结束')
}
```

### 使用说明

根据工作流的配置要求，定义相关的业务流程配置，给到 Side Panel 和 Content Script。由 Side Panel 开始启动工作流，Background 作为 Side Panel 和 Content Script 之间的通信桥梁。

```text
     +---------------+
     |  configures   | -+
     +---------------+  |
       |                |
       |                |
       v                |
     +---------------+  |
  +> | Content Script |  |
  |  +---------------+  |
  |    |                |
  |    |                |
  |    v                v
  |  +--------------------+
  +- |     Side Panel      |
     +--------------------+
       |                ^
       |                |
       v                |
     +---------------+  |
     |    Background    | -+
     +---------------+
```

### 主要功能

1. 任务定义：支持通过配置对象定义复杂的任务结构
2. 任务流控制：基于任务执行结果动态决定下一步执行路径
3. 任务重试：内置任务重试机制，可自定义重试次数和间隔
4. 循环执行：支持循环数据处理，可动态添加循环项
5. 生命周期钩子：提供任务前后的回调函数，便于扩展和监控

### 注意点

1. Conten Script 和 Side Panel 会使用一样的任务配置，但它们的上下文是互相独立，所以在写任务配置时，要注意点
2. 页面跳转或刷新后，Content Script 都会重新注入，要注意如何缓存变量

### 内置事件清单

| 事件常量 | 描述 |
|----------|------|
| EVENT_CHANGE_CURRENT_TAB_BY_BG | 通过 bg 更改当前标签页 |
| EVENT_OPEN_URL_SP2BG | 从 sp 向 bg 发送打开 URL 请求 |
| EVENT_RELOAD_SP2BG | 从 sp 向 bg 发送重新加载请求 |
| EVENT_REDIRECT_URL_SP2BG | 从 sp 向 bg 发送 URL 重定向请求 |
| EVENT_REMOVE_TAB_SP2BG | 从 sp 向 bg 发送移除标签页请求 |
| EVENT_GET_COOKIES_SP2BG | 从 sp 向 bg 发送获取 Cookies 请求 |
| EVENT_CHECK_TAB_STATUS_SP2BG | 从 sp 向 bg 发送检查标签页状态请求 |
| EVENT_INJECT_INTERCEPT_SCRIPT_SP2BG | 从 sp 向 bg 发送注入拦截脚本请求 |

内置的默认事件：

```typescript
export function initBackground() {
  cetBGLogger.info('initBackground')
  onMsgInBG<CetLogEntry>(EVENTS.CS2BG_LOG, async (data) => {
    return true
  })
  onMsgInBG<CetLogEntry>(EVENTS.SP2BG_LOG, async (data) => {
    return true
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs?.[0]
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs?.[0]
  })
  // sp 通知 bg 打开 url
  onMsgInBG<{ url: string }>(EVENT_OPEN_URL_SP2BG, async (data) => {
    chrome.tabs.create({ url: data.url })
  })
  // sp 通知 bg 刷新页面
  onMsgInBG<number>(EVENT_RELOAD_SP2BG, async (tabId) => {
    chrome.tabs.reload(tabId)
  })
  // sp 通知 bg 重定向 url
  onMsgInBG<{ url: string, tabId: number }>(EVENT_REDIRECT_URL_SP2BG, async (data) => {
    chrome.tabs.update(data.tabId, { url: data.url })
    return true
  })
  // sp 通知 bg 移除 tab
  onMsgInBG<CetEventRemoveTabParams>(EVENT_REMOVE_TAB_SP2BG, async (data) => {
    setTimeout(() => {
      chrome.tabs.remove(data.tabId)
    }, data.pending || 0)
  })
  // 获取 Cookie
  onMsgInBG<string>(EVENT_GET_COOKIES_SP2BG, async (domain) => {
    return new Promise((res) => {
      chrome.cookies.getAll({
        domain,
      }, (cookies) => {
        res(cookies)
      })
    })
  })
  // sp 通知 bg 检查 tab 状态
  onMsgInBG(EVENT_CHECK_TAB_STATUS_SP2BG, async (params: { tabId: number }) => {
    if (!params.tabId)
      return false
    const result = await checkTabStatus(params.tabId)
    return result
  })
}
```



## 消息通信

### 简介

> 目前有很多相关的封装，但这块消息通信的复杂度并不高，为了方便和更适配我的写法，所以我自己重新封装了消息通信的功能。

封装 Chrome Extension 的消息方法，统一 Background, Content Script 和 Side Panel 的消息通信：

1. 统一的消息格式：所有消息具有一致的数据结构，便于处理和调试，简化使用
2. 双向通信：支持发送消息并接收响应
3. 类型安全：完整的TypeScript类型支持（未完善）

浏览器的消息通信由三个部分组成：

1. Background(Service) -> sv
2. Content Script -> cs
3. popup/Side Panel(后面称 Side Panel) -> sp

每个浏览器插件，只会各有一个 Background 和 Side Panel，会有多个 Content Script，所以关于 Content Script 的通信，都需要带上对应的 tabId，保证 Background(Side Panel) 可以给指定的 Content Script 发消息。

### 发送和接收的数据结构

```typescript
// send
const result = await sendMsgByCS(messageId, data, { destination: CetDestination.BG , tabId?: ...})
// receive
onMsgInBg(messageId, (data, params) => {
  return xx
})

export interface CetMessageCallbackParams {
  tabId?: number
  option: CetDestinationOption
  messageId: string
}
export interface CetMessageSendResult<T = unknown> {
  data: T
  tabId?: number
  messageId: string
  success: boolean
  msg?: string
}

```

### 使用

#### Background 发给 Content Script

Background 发给 Content Script 需要带上 tabId 才能指定发给谁：

```typescript
import { sendMsgByBG, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgByBG('test1', { ... }, { tabId: tabId, destination: CetDestination.cs })
```

#### Background 发给 side panel

```typescript
import { sendMsgByBG, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgByBG('test1', { ... }, { destination: CetDestination.sp })
```

#### side panel 发给 Background

```typescript
import { sendMsgBySP, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgBySP('toBg', { ... }, { destination: CetDestination.BG });
```

#### side panel 发给 Content Script

Side panel 发给 Content Script 需要带上 tabId 才能指定发给谁：

```typescript
import { sendMsgBySP, CetDestination, EVENTS } from 'chrome-extension-tools'
const  { data } = await sendMsgBySP(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG });
const res = await sendMsgBySP('test1', { ... }, { estination: CetDestination.CS, tabId: tabId })
```

Content Script 监听：

```typescript
import { onMsgInCS } from 'chrome-extension-tools'
onMsgInCS('test1', async (res) => {
  console.log('test1', res)
  return 'ok'
})
```

#### Content Script 发给 Background

Content Script 发送给 Background，可以不带 tabId

```typescript
import { sendMsgByCS } from 'chrome-extension-tools'
const res = await sendMsgByCS('test2', { name: 'task1' }, { destination: CetDestination.BG })
```

#### Content Script 发给 side panel

Content Script 发给 side panel：

```typescript
import { CetDestination, sendMsgBySP } from 'chrome-extension-tools'
const { data } = await sendMsgByCS('test3', undefined, { destination: CetDestination.SP })
```

side panel 监听：

```typescript
import { CetDestination, onMsgInSP } from 'chrome-extension-tools'
onMsgInCS('test3', async (res) => {
  console.log('test3', res)
  return 'ok'
})
```



## 请求拦截组件

请求拦截模块通过改写原生的 XHR 和 Fetch ，实现对网络请求的监控。

### 配置方式

#### 新增一个文件，backgroudn/intercept-reqeust.ts:

```typescript
import { initInterceptRequest } from 'chrome-extension-tools'
initInterceptRequest()
```

#### 新增 vite 构建配置，并在 package.json 配置相关命令：

```typescript
ort { defineConfig } from 'vite'
import packageJson from './package.json'
import { isDev, r } from './scripts/utils'
import { sharedConfig } from './vite.config.dev.mjs'

// bundling the Content Script using Vite
export default defineConfig({
  ...sharedConfig,
  define: {
    '__DEV__': isDev,
    '__NAME__': JSON.stringify(packageJson.name),
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  build: {
    watch: isDev
      ? {}
      : undefined,
    outDir: r('extension/dist/Background'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    lib: {
      entry: r('src/Background/intercept-request.ts'),
      name: packageJson.name,
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: (chunk) => {
          if (chunk.name === 'main')
            return 'index.mjs'
          else
            return 'intercept-request.mjs'
        },
        extend: true,
      },
    },
  },
})

```

package.json:

```json
{
  "scripts": {
    ...
    "dev:background-intercept-request": "npm run build:background-intercept-request -- --mode development",
    "build:background-intercept-request": "vite build --config vite.config.background-intercept-request.mts",
  }
}
```

#### 选择合适的时间，注入该方法

你可以当每个 Tab 创建或更新的时候注入，也可以自定义时机注入，下面是当组件刷新并加载完 Tab 时注入：

```typescript
import { injectInterceptRequest } from 'chrome-extension-tools'

// 定义目标域名
const targetDomains = ['https://example.com/*']

// 注入拦截代码
function injectInterceptRequestBg() {
  injectInterceptRequest('./dist/Background/intercept-request.mjs', targetDomains)
}

// 在适当的时机触发注入
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if ((tab.url || '').includes('example.com')) {
      injectInterceptRequestBg()
    }
  }
})
```

这样在 Background 的配置已经完成，我们还需要在 Content Script 去接受脚本捕获的接口数据。

#### 在 Content Script 初始化监听方法

```typescript
// Content Script
import { initContentScriptRequest } from 'chrome-extension-tools'
// 获取接口拦截的信息
initContentScriptRequest()
```

#### 收到数据后，会通过消息通知发给 Background 和 Side Panel：

```typescript
import { EVENTS, handleResponseData } from 'chrome-extension-tools'

// Content Script 收到请求后，会通知给 sp
onMsgInSP(EVENTS.CS2SP_GET_REQUEST, async (data) => {
  if (!data)
    return
  const res = {
    url: data.url || '',
    response: handleResponseData(data?.response),
    data: handleResponseData(data?.data),
    body: handleResponseData(data?.body),
    headers: handleResponseData(data?.headers),
    id: data.id,
  }
  cetTest1Logger.info(serializeJSON(res))
})
```

### 注意事项

1. 首次访问页面时可能需要刷新才能完全捕获请求数据
2. 拦截功能仅对注入后发生的请求有效


## 日志模块

封装日志功能，方便开发、调式和后续的拓展。

组件库内已经默认初始化一个 logger，它会收集内置的消息通知：

```typescript
import { CetLogger, CetLogLevel } from 'chrome-extension-tools'

export const cetLogger = new CetLogger({
  isCS: true,
  isSP: true,
  isSyncToBG: true,
  isSyncToSP: true,
  level: CetLogLevel.DEBUG,
})

```

### 基本用法

```typescript
import { CetLogger, CetLogLevel } from 'chrome-extension-tools'

// 创建日志实例
const logger = new CetLogger({
  level: CetLogLevel.DEBUG,
  prefix: '[My Extension]',
  maxCacheSize: 1000
})

// 记录不同级别的日志
logger.debug('调试信息')
logger.info('普通信息')
logger.warn('警告信息')
logger.error('错误信息')
```

### 配置选项

| 选项名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| level | LogLevel | INFO | 日志级别，可选值：DEBUG、INFO、WARN、ERROR |
| timestamp | boolean | true | 是否显示时间戳 |
| prefix | string | '[Chrome Extension]' | 日志前缀 |
| color | boolean | true | 是否使用颜色输出 |
| maxCacheSize | number | 5000 | 最大缓存日志数量 |
| isSyncToBG | boolean | false | 是否同步到 bg 进程 |
| isSyncToSP | boolean | false | 是否同步到弹出窗口 |
| isCS | boolean | false | 是否为内容脚本 |
| isShowInConsole | boolean | false | 是否在 console.log 显示日志 |

### 日志缓存

日志模块支持日志缓存功能，可以通过以下方法操作缓存：

```typescript
// 获取所有缓存的日志
const allLogs = logger.getLogs()

// 获取指定级别的日志
const errorLogs = logger.getLogsByLevel(LogLevel.ERROR)

// 清空日志缓存
logger.clearLogs()

// 获取当前缓存大小
const cacheSize = logger.getCacheSize()
```



## 工具函数

除了主要模块外，该库还提供了一系列实用的工具函数，帮助开发者简化常见操作。

### 常用工具函数

#### asyncSetTimeout

创建一个Promise包装的setTimeout，用于异步等待指定时间。

```typescript
import { asyncSetTimeout } from 'chrome-extension-tools'

// 等待1秒（默认值）
await asyncSetTimeout()

// 等待指定时间（毫秒）
await asyncSetTimeout(2000) // 等待2秒
```

#### loopCheck

循环执行指定的检查函数，直到检查成功或达到最大尝试次数。适用于需要轮询检查条件是否满足的场景。

```typescript
import { loopCheck } from 'chrome-extension-tools'

// 示例：检查页面上的元素是否出现
const elementAppeared = await loopCheck(
  async (times) => {
    console.log(`第${times}次检查`)
    const element = document.querySelector('#target-element')
    return !!element
  },
  20, // 最大尝试次数，默认10次
  500  // 每次检查间隔（毫秒），默认1000ms
)

if (elementAppeared) {
  console.log('元素已出现')
} else {
  console.log('检查超时，元素未出现')
}
```

#### serializeJSON

将任意值安全地序列化为JSON字符串，处理序列化过程中可能出现的错误。

```typescript
import { serializeJSON } from 'chrome-extension-tools'

// 正常对象序列化
const jsonStr = serializeJSON({ name: '测试', value: 123 })

// 处理循环引用等无法正常序列化的情况
const circularObj = { self: null }
circularObj.self = circularObj
const safeStr = serializeJSON(circularObj) // 返回原始值而不会抛出错误
```

#### deserializeJSON

将JSON字符串安全地反序列化为JavaScript对象，处理解析过程中可能出现的错误。

```typescript
import { deserializeJSON } from 'chrome-extension-tools'

// 正常JSON字符串解析
const obj = deserializeJSON('{"name":"测试","value":123}')

// 处理格式错误的JSON
const result = deserializeJSON('{"broken json') // 返回原始字符串而不会抛出错误
```

#### generateTenDigitRandom

生成指定范围内的随机十位数字，默认生成10位数字（10亿到99亿之间）。

```typescript
import { generateTenDigitRandom } from 'chrome-extension-tools'

// 生成默认范围内的随机数（10亿到99亿之间）
const random1 = generateTenDigitRandom()

// 指定范围生成随机数
const random2 = generateTenDigitRandom(5000000000, 1000000000) // 10亿到50亿之间
```

## 未来计划

1. 添加更多常用组件
2. 给消息通知添加类型定义
3. 实现更多实用工具函数
4. 优化工作流参数配置
5. 消息通知，支持事件的类型定义
