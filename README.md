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
