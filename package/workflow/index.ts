/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-02-12 17:50:09
 * @LastEditors: Lu
 * @Description:
 */
import { onMessage, sendMessage } from 'webext-bridge/background'
import { EVENTS } from '../constants'

export * from './actuator'

export function initService() {
  onMessage(EVENTS.SP2CS_EXECUTE_TASK, async ({ data }) => {
    const res = await sendMessage(EVENTS.SP2CS_EXECUTE_TASK, data, {
      context: 'content-script',
      tabId: data.tabId,
    })
    return res
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
