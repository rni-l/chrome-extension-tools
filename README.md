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

首先要在 background 注册同样的事件：

```typescript
import { onMsgInBG } from 'chrome-extension-tools'
onMsgInBG('test1', async () => undefined)
```

Side panel 发给 content script 需要带上 tabId 才能指定发给谁：

```typescript
import { sendMsgBySP, CetDestination, EVENTS } from 'chrome-extension-tools'
const  { data } = await sendMsgBySP(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG });
const res = await sendMsgBySP('test1', { ... }, { estination: CetDestination.CS, tabId: tabId })
```

如果想广播给所有的 content script，可以不带上 tabId

```typescript
import { sendMsgBySP, CetDestination } from 'chrome-extension-tools'
const res = await sendMsgBySP('test1', { ... }, { estination: CetDestination.CS })
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

contetn script 发送给 background，可以不带 tabId

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
