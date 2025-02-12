import { createApp } from 'vue'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { setupApp } from '~/logic/common-setup'
import App from './views/App.vue'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  console.info('[vitesse-webext] Hello world from content script')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', async ({ data }: any) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
    console.log(data.tabId)
    const res = await sendMessage('cs2sp', {
      message: 'hello from content-script',
      tabId: data.tabId,
    }, 'background')
    console.log(res)
  })
  onMessage('sp2cs', (data: any) => {
    console.log(data)
    return 'ok'
  })
  const response = await sendMessage('cs2sv', {
    first_name: 'John',
    last_name: 'Doe',
  }, 'background')
  console.log('background response:', response)

  // mount component to context window
  const container = document.createElement('div')
  container.id = __NAME__
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  document.body.appendChild(container)
  const app = createApp(App)
  setupApp(app)
  app.mount(root)
})()
