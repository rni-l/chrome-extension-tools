import type { Tabs } from 'webextension-polyfill'
import { onMessage, sendMessage } from 'webext-bridge/background'
import { sendMessage as sendSp } from 'webext-bridge/popup'

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
  // @ts-expect-error missing types
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error))
}

browser.runtime.onInstalled.addListener((): void => {
  console.log('Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title, tabId }, { context: 'content-script', tabId })
  // sendSp('sv2sp', { title: tab.title }, 'popup')
  const r = await sendMessage('sv2sp', { tabId }, 'popup')
  // const r = await sendMessage('sv2sp', { title: 'd' }, 'popup')
  console.log(r)
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})
onMessage('cs2sv', async ({ data }) => {
  console.log('cs2sv', data)
  return 'ok'
})
onMessage('sp2sv', async (data) => {
  console.log(data)
  return 'ok'
})
onMessage('cs2sp', async (data: any) => {
  console.log('cs2sp', data)
  const r = await sendMessage('cs2sp', { tabId: data.tabId }, 'popup')
  return r
})
