
import { initBackground } from '../../package/workflow/index';
import { EVENTS } from '../../package/constants';
import { initBGMsgListener, onMsgInBG } from '../../package/message';
import { checkAndInjectDomain } from './utils.bg';
import { getCurrentTab, handleResponseData } from '../../package/utils';
// import { cetLogger } from '../../package/components/logger/ins.logger';
// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// remove or turn this off if you don't use side panel
const USE_SIDE_PANEL = false
const cacheTabInject: Record<string, boolean> = {}
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
  console.log('bg onActivated', tab.tabId)
  const { tabId } = tab
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
  console.log('tab updated', tabId, changeInfo.status)
  if (!checkIsTargetWindow(tab))
    return
  // console.log('onUpdated', tabId)
  curTabId = tabId
  // 检查页面是否完成加载
  if (changeInfo.status === 'complete') {
    // console.log('Tab updated:', tab)
    // console.log('URL:', tab.url)
  }
})

chrome.tabs.onCreated.addListener((tab) => {
  console.log('tab created', tab.id)
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
  console.log('tab replaced', newTabId)
})

onMsgInBG('to-cs', async () => undefined)
onMsgInBG('test3', async () => undefined)
onMsgInBG('task1', async () => undefined)

onMsgInBG(EVENTS.CS2BG_GET_REQUEST, async (data: any) => {
  console.log(data)
  console.log(data?.url)
  console.log(handleResponseData(data?.response))
})

onMsgInBG(EVENTS.SP2BG_INJECT_INTERCEPT_REQUEST, async () => {
  const tab = await getCurrentTab()
  if (!tab)
    return false
  checkAndInjectDomain(cacheTabInject, tab.id || 0, tab?.url)
  return true
})

initBGMsgListener()
initBackground()

// setInterval(() => {
//   console.log(cetLogger.getLogs())
// }, 1000)