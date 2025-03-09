/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-03-04 17:39:54
 * @LastEditors: Lu
 * @Description:
 */

import type { CetLogEntry, CetWorkFlowConfigure, CsFnParams } from '../types'
import { cetLogger } from '../components/logger/ins.logger'
import { EVENTS } from '../constants'
import { onMsgInBG, onMsgInCS, onMsgInSP, sendMsgByCS } from '../message'
import { CetDestination } from '../types'
import { generateTenDigitRandom, serializeJSON } from '../utils'

export * from './actuator'

export function initService() {
  cetLogger.info('initService')
  onMsgInBG<CetLogEntry>(EVENTS.CS2BG_LOG, async (data) => {
    cetLogger.log(data)
  })
  onMsgInBG<CetLogEntry>(EVENTS.SP2BG_LOG, async (data) => {
    cetLogger.log(data)
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, async (data, params) => {
    cetLogger.info('bg SP2BG_GET_CURRENT_TAB: ', serializeJSON(data), serializeJSON(params))
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    cetLogger.info('bg SP2BG_GET_CURRENT_TAB RESULT: ', serializeJSON(tabs))
    return tabs[0]
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, async (data, params) => {
    cetLogger.info('bg CS2BG_GET_CURRENT_TAB: ', serializeJSON(data), serializeJSON(params))
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    cetLogger.info('bg CS2BG_GET_CURRENT_TAB RESULT: ', serializeJSON(tabs))
    return tabs[0]
  })
}

export function initSidePanel() {
  cetLogger.info('initSidePanel')
  onMsgInSP<CetLogEntry>(EVENTS.CS2SP_LOG, async (data) => {
    cetLogger.log(data)
  })
}

// TODO: 需要优化，目前只支持一个 content script 执行一个工作流
export function initContentScript(configures?: CetWorkFlowConfigure[]) {
  cetLogger.info('initContentScript')
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
    cetLogger.info('SP2CS_EXECUTE_TASK: ', serializeJSON(res))
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
