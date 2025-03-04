/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-03-04 16:41:59
 * @LastEditors: Lu
 * @Description:
 */

import { configures as cacheConfigures, EVENTS } from '../constants'
import { onMsgInBG, onMsgInCS, sendMsgByCS } from '../message'
import { CetDestination, type CetWorkFlowConfigure, type CsFnParams } from '../types'
import { generateTenDigitRandom, serializeJSON } from '../utils'

export * from './actuator'

export function initService() {
  if (cacheConfigures.debug) {
    console.log('initService')
  }
  onMsgInBG<chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, async (data, params) => {
    if (cacheConfigures.debug) {
      console.log('bg SP2BG_GET_CURRENT_TAB', data, params)
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (cacheConfigures.debug) {
      console.log('bg SP2BG_GET_CURRENT_TAB', tabs)
    }
    return tabs[0]
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, async (data, params) => {
    if (cacheConfigures.debug) {
      console.log('bg CS2BG_GET_CURRENT_TAB', data, params)
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (cacheConfigures.debug) {
      console.log('bg CS2BG_GET_CURRENT_TAB', tabs)
    }
    return tabs[0]
  })
}

// TODO: 需要优化，目前只支持一个 content script 执行一个工作流
export function initContentScript(configures?: CetWorkFlowConfigure[]) {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === EVENTS.GET_CONTENT_SCRIPT_REQUEST) {
      const res = serializeJSON(event.data.data.response)
      const item = {
        url: event.data.data.url,
        response: res,
        requestType: event.data.data.requestType,
        id: generateTenDigitRandom(),
      }
      sendMsgByCS(EVENTS.CS2SP_GET_REQUEST, item, { destination: CetDestination.SP })
      sendMsgByCS(EVENTS.CS2BG_GET_REQUEST, item, { destination: CetDestination.BG })
    }
  }, false)
  if (!configures) {
    return
  }

  onMsgInCS<CsFnParams>(EVENTS.SP2CS_EXECUTE_TASK, async (res) => {
    if (cacheConfigures.debug) {
      console.log('SP2CS_EXECUTE_TASK', res)
    }
    const csFn = configures.find(v => v.name === res.name)?.csFn
    if (csFn) {
      const csResult = await csFn(res)
      return csResult
    }
    else {
      return { next: true }
    }
  })
}
