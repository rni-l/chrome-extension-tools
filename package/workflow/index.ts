/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-02-19 23:38:23
 * @LastEditors: Lu
 * @Description:
 */
import { EVENTS } from '../constants'

export * from './actuator'

export function initService(onMessage: any, sendMessage: any) {
  console.log('onMessage')
  console.log(onMessage)
  onMessage(EVENTS.SP2CS_EXECUTE_TASK, async ({ data }: any) => {
    const res = await sendMessage(EVENTS.SP2CS_EXECUTE_TASK, data, {
      context: 'content-script',
      tabId: data.tabId,
    })
    return res
  })
  onMessage(EVENTS.SP2BG_GET_CURRENT_TAB, async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]
  })
  onMessage(EVENTS.CS2BG_GET_CURRENT_TAB, async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]
  })
}

// export function initContentScript() {
//   onMessage(EVENTS.SP2CS_EXECUTE_TASK, async ({ data }) => {
//     const csFn = configure.csFn
//     if (csFn) {
//       const csResult = await csFn(data)
//       return csResult
//     } else {
//       return { next: true }
//     }
//   })
// }
