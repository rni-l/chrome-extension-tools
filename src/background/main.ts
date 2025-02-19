import { onMessage, sendMessage } from 'webext-bridge/background'
import { initService } from '../../package/workflow/index';
import { EVENTS } from '../../package/constants';
// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}


// remove or turn this off if you don't use side panel
const USE_SIDE_PANEL = false

// to toggle the sidepanel with the action button in chromium:
if (USE_SIDE_PANEL) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error))
}

chrome.runtime.onInstalled.addListener((): void => {
  console.log('Extension installed')
})

let previousTabId = 0
let curTabId = 0
let windowId = 0
function checkIsTargetWindow(tab: { windowId: number }) {
  console.log('current window Id:', windowId, ' target window id:', tab.windowId)
  if (windowId && tab.windowId !== windowId)
    return false
  return true
}
// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
chrome.tabs.onActivated.addListener(async (tab) => {
  const { tabId } = tab
  console.log('bg onActivated', tab, tabId)
  if (!checkIsTargetWindow(tab))
    return
  if (!previousTabId) {
    previousTabId = tabId
    return
  }
  curTabId = tabId

  let tmp: chrome.tabs.Tab

  try {
    tmp = await chrome.tabs.get(curTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  console.log('previous tab', tmp)
  // sendMessage('tab-prev', { title: tmp.title }, { context: 'content-script', tabId })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!checkIsTargetWindow(tab))
    return
  // console.log('onUpdated', tabId)
  curTabId = tabId
  // 检查页面是否完成加载
  if (changeInfo.status === 'complete') {
    // console.log('Tab updated:', tab)
    // console.log('URL:', tab.url)
    // 这里可以执行更多的逻辑处理，例如检查URL是否符合特定模式等
  }
})

chrome.tabs.onCreated.addListener((tab) => {
  if (!checkIsTargetWindow(tab))
    return
  // console.log('onCreated')
  curTabId = tab.id || 0
})
chrome.tabs.onRemoved.addListener((tabId) => {
  // console.log('onRemoved', tabId)
})
chrome.tabs.onReplaced.addListener((newTabId, oldTabId) => {
  // console.log('onReplaced', newTabId, oldTabId)
  curTabId = newTabId
})

// onMessage('get-current-tab', async () => {
//   try {
//     const tab = await chrome.tabs.get(previousTabId)
//     return {
//       title: tab?.title,
//     }
//   }
//   catch {
//     return {
//       title: undefined,
//     }
//   }
// })
// onMessage('cs2sv', async ({ data }) => {
//   console.log('cs2sv', data)
//   return 'ok'
// })
// onMessage('sp2sv', async (data) => {
//   console.log(data)
//   return 'ok'
// })
// onMessage('cs2sp', async (data: any) => {
//   console.log('cs2sp', data)
//   const r = await sendMessage('cs2sp', { tabId: data.tabId }, 'popup')
//   return r
// })

// onMessage(EVENTS.SP2CS_EXECUTE_TASK, async ({ data }: any) => {
//   const res = await sendMessage(EVENTS.SP2CS_EXECUTE_TASK, data, {
//     context: 'content-script',
//     tabId: data.tabId,
//   })
//   return res
// })
onMessage(EVENTS.SP2BG_GET_CURRENT_TAB, async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
})
onMessage(EVENTS.CS2BG_GET_CURRENT_TAB, async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0]
})
initService(onMessage, sendMessage)