# Chrome-extension-tools

浏览器插件

## 工作流的使用

你可以使用该工作流库，来实现复杂业务流程的自动化，定义多层级任务流程，基于每个任务的执行结果来动态调整后续的任务执行，支持任务的重试和重新执行等功能。

### 使用说明

该工作流是需要编写代码来实现相关的业务流程，它只提供流程等相关的基础功能。

以 sidePanel 为中心，根据工作流的配置要求，定义相关的业务流程配置，给到 sidePanel 和 contentScript。由 sidePanel 开始启动工作流，service 作为 sidePanel 和 contentScript 之间的通信桥梁。

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
     |    service    | -+
     +---------------+
```

### 快速开始

## 消息通信

浏览器的消息通信由三个部分组成：

1. service(background) -> sv
2. content script -> cs
3. popup/sidePanel(后面称 sidePanel) -> sp

每个浏览器插件，只会各有一个 service 和 sidePanel，会有多个 content script，所以关于 content script 的通信，都需要带上对应的 tabId

### service to content script

```js
// service
import { onMessage, sendMessage } from 'webext-bridge/background'
sendMessage('sv2cs', { title: 'service to content script' }, { context: 'content-script', tabId })
```

```js
// content script
import { onMessage } from 'webext-bridge/content-script'

onMessage('sv2cs', ({ data }) => {
  console.log(`received: "${data.title}"`)
})
```

### content script to service

```js
// content script
import { sendMessage } from 'webext-bridge/content-script'
const response = await sendMessage('cs2sv', {
  first_name: 'John',
  last_name: 'Doe',
}, 'background')
console.log('background response:', response)
```

```js
// service
import { onMessage } from 'webext-bridge/background'
onMessage('cs2sv', async ({ data }) => {
  console.log('cs2sv', data)
  return 'ok'
})
```

### service to popup/sidePanel

```js
// service
import { sendMessage } from 'webext-bridge/background'
const r = await sendMessage('sv2sp', { title: 'd' }, 'popup')
```

```js
// popup
import { onMessage } from 'webext-bridge/popup'
onMessage('sv2sp', (message) => {
  console.log('service message', message)
  return 'ok'
})
```

### popup/sidePanel to service

```js
// popup
import { sendMessage } from 'webext-bridge/popup'
async function sendToBackground() {
  const res = await sendMessage('sp2sv', {
    first_name: 'John',
    last_name: 'Doe'
  }, 'background')
  console.log('service response', res)
}
```

```js
// service
import { onMessage } from 'webext-bridge/background'
onMessage('sp2sv', (data) => {
  console.log(data)
  return 'ok'
})
```

### popup/sidePanel to content script

要带上 tabId

```js
// popup
import { sendMessage } from 'webext-bridge/popup'
const res = await sendMessage('sp2cs', {
  tabId,
  message: 'hello from sidepanel',
}, { context: 'content-script', tabId })
```

```js
// content script
import { onMessage } from 'webext-bridge/content-script'
onMessage('sp2cs', (data) => {
  console.log(data)
  return 'ok'
})
```

### content script to popup/sidePanel

两者不能直接通信，可以通过 service 进行中转

```js
// content script
import { sendMessage } from 'webext-bridge/content-script'
const res = await sendMessage('cs2sp', {
  message: 'hello from content-script',
  tabId: data.tabId,
}, 'background')
```

```js
// service
import { onMessage } from 'webext-bridge/background'
onMessage('cs2sp', async (data) => {
  console.log('cs2sp', data)
  const r = await sendMessage('cs2sp', { tabId: data.tabId }, 'popup')
  return r
})
```

```js
// popup
import { onMessage } from 'webext-bridge/popup'
onMessage('cs2sp', (data) => {
  console.log(data)
  return {
    data,
    type: 'popup'
  }
})
```
