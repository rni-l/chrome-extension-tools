# Chrome-extension-tools

浏览器插件

## 工作流的使用

你可以使用该工作流库，来实现复杂业务流程的自动化，定义多层级任务流程，基于每个任务的执行结果来动态调整后续的任务执行，支持任务的重试和重新执行等功能。

### 使用说明

该工作流是需要编写代码来实现相关的业务流程，它只提供流程等相关的基础功能。

以 sidePanel 为中心，根据工作流的配置要求，定义相关的业务流程配置，给到 sidePanel 和 contentScript。由 sidePanel 开始启动工作流，background 作为 sidePanel 和 contentScript 之间的通信桥梁。

```text
     +---------------+
     |  configures   | -+
     +---------------+  |
       |                |
       |                |
       v                |
     +---------------+  |
  +> | contentScript |  |
  |  +---------------+  |
  |    |                |
  |    |                |
  |    v                v
  |  +--------------------+
  +- |     sidePanel      |
     +--------------------+
       |                ^
       |                |
       v                |
     +---------------+  |
     |    background    | -+
     +---------------+
```

### 快速开始

## 消息通信

浏览器的消息通信由三个部分组成：

1. service(background) -> sv
2. content script -> cs
3. popup/sidePanel(后面称 sidePanel) -> sp

每个浏览器插件，只会各有一个 service 和 sidePanel，会有多个 content script，所以关于 content script 的通信，都需要带上对应的 tabId，保证 background(sidePanel) 可以给指定的 content script 发消息。

这块消息通信的复杂度并不高，为了方便和更适配我的写法，所以我自己重新封装了消息通信的功能。

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

### background 发给 content script

Background 发给 content script 需要带上 tabId 才能指定发给谁：

```typescript
import { sendMsgByBG, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgByBG('test1', { ... }, { tabId: tabId, destination: CetDestination.cs })
```

### background 发给 side panel

```typescript
import { sendMsgByBG, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgByBG('test1', { ... }, { destination: CetDestination.sp })
```

### side panel 发给 background

```typescript
import { sendMsgBySP, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgBySP('toBg', { ... }, { destination: CetDestination.BG });
```

### side panel 发给 content script

Side panel 发给 content script 需要带上 tabId 才能指定发给谁：

```typescript
import { sendMsgBySP, CetDestination, EVENTS } from 'chrome-extension-tools'
const  { data } = await sendMsgBySP(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG });
const res = await sendMsgBySP('test1', { ... }, { estination: CetDestination.CS, tabId: tabId })
```

content script 监听：

```typescript
import { onMsgInCS } from 'chrome-extension-tools'
onMsgInCS('test1', async (res) => {
  console.log('test1', res)
  return 'ok'
})
```

### content script 发给 background

content script 发送给 background，可以不带 tabId

```typescript
import { sendMsgByCS } from 'chrome-extension-tools'
const res = await sendMsgByCS('test2', { name: 'task1' }, { destination: CetDestination.BG })
```

### content script 发给 side panel

content script 发给 side panel：

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



## 请求拦截

通过改写 xhr 和 fetch，来获取请求数据。

### 配置方式

第一，新增一个新的 background 文件，backgroudn/intercept-reqeust.ts:

```typescript
import { initInterceptRequest } from 'chrome-extension-tools'
initInterceptRequest()
```

第二，新增 vite 构建配置，并在 package.json 配置相关命令：

```typescript
ort { defineConfig } from 'vite'
import packageJson from './package.json'
import { isDev, r } from './scripts/utils'
import { sharedConfig } from './vite.config.dev.mjs'

// bundling the content script using Vite
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
    outDir: r('extension/dist/background'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    lib: {
      entry: r('src/background/intercept-request.ts'),
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

这样 background 区域就会构建两个入口文件。

在 background 引入 `injectInterceptRequest` 方法，并且在 tabs 事件中，选择一个合适的时机注入代码：

```typescript
import { injectInterceptRequest } from 'chrome-extension-tools'

const targetDomains = [
  'https://xxx.com/*',
]
const checkDomains = [
  'https://xxx.com',
]
function injectInterceptRequestBg() {
  injectInterceptRequest('./dist/background/intercept-request.mjs', targetDomains)
}
function checkAndInjectDomain(url?: string) {
  if (checkDomains.some(v => (url || '').includes(v))) {
    injectInterceptRequestBg()
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  curTabId = tabId
  // 检查页面是否完成加载
  if (changeInfo.status === 'complete') {
    // 注入脚本
    checkAndInjectDomain(tab.url)
  }
})
```

这样在 background 的配置已经完成，我们还需要在 content script 去接受脚本捕获的接口数据。

在这个库中已经配置好相关的初始化工作：

```typescript
// content script
import { initContentScriptRequest } from 'chrome-extension-tools'
// 获取接口拦截的信息
initContentScriptRequest()
```

收到数据，会通过消息通知发给 background 和 side panel：

```typescript
import { CetLogEntry, CetLogger, EVENTS, handleResponseData } from 'chrome-extension-tools'
const logList = ref<CetLogEntry[]>([])
const cetTest1Logger = new CetLogger()
cetTest1Logger.logChange = (logs: CetLogEntry[]) => {
  logList.value = logs.map(v => v)
}
// content script 收到请求后，会通知给 sp
onMsgInSP(EVENTS.CS2SP_GET_REQUEST, async (data) => {
  if (!data)
    return
  if (typeof data.url !== 'string')
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

这种捕获方式，如果是第一次访问页面，脚本虽然注入了，但捕获不了数据，需要刷新一次页面才行。



## 日志模块

日志模块提供了一个统一的日志记录系统，支持多级别日志、日志缓存、跨进程同步等功能。

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

// 获取日志实例
const logger = CetLogger.getInstance({
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
| isSyncToBG | boolean | false | 是否同步到后台进程 |
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

### 跨进程同步

支持将 content script 或 sidepanel 的日志同步到 sidepanel 或 background

```typescript
// content script 将日志同步到 background 和 sidepanel
const logger = CetLogger.getInstance({
  isCS: true,
  isSyncToBG: true,
  isSyncToSP: true,
})

// side panel 将日志同步到 background
const logger = CetLogger.getInstance({
  isSP: true,
  isSyncToBG: true,
})
```

### 动态配置

可以通过 `setOptions` 方法动态修改日志配置：

```typescript
logger.setOptions({
  level: LogLevel.WARN,
  timestamp: false
})
```


## TODO
1. ~~工作流支持动态循环数据~~
2. 添加常用组件
3. ~~单循环如果终结，不应该整个循环结束掉~~
4. ~~优化工作流的参数~~
5. ~~tabId 和 tabUrl 的获取逻辑~~
6. 给消息通知添加类型定义