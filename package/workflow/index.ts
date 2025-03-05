/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-03-05 16:40:42
 * @LastEditors: Lu
 * @Description:
 */

import type { CetLogEntry, CetWorkFlowConfigure, CsFnParams } from '../types'
import { cetBGLogger, cetCSLogger, cetSPLogger } from '../components/logger'
import { EVENTS } from '../constants'
import { onMsgInBG, onMsgInCS, onMsgInSP, sendMsgByCS } from '../message'
import { CetDestination } from '../types'
import { generateTenDigitRandom, serializeJSON } from '../utils'

export * from './actuator'

export function initBackground() {
  cetBGLogger.info('initBackground')
  onMsgInBG<CetLogEntry>(EVENTS.CS2BG_LOG, async (data) => {
    console.log(EVENTS.CS2BG_LOG, data)
    cetBGLogger.log(data)
  })
  onMsgInBG<CetLogEntry>(EVENTS.SP2BG_LOG, async (data) => {
    cetBGLogger.log(data)
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, async () => {
    cetBGLogger.info('bg SP2BG_GET_CURRENT_TAB: ')
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    cetBGLogger.info('bg SP2BG_GET_CURRENT_TAB RESULT: ', serializeJSON(tabs))
    return tabs[0]
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, async () => {
    cetBGLogger.info('bg CS2BG_GET_CURRENT_TAB: ')
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    cetBGLogger.info('bg CS2BG_GET_CURRENT_TAB RESULT: ', serializeJSON(tabs))
    return tabs[0]
  })
}

export function initSidePanel() {
  cetSPLogger.info('initSidePanel')
  onMsgInSP<CetLogEntry>(EVENTS.CS2SP_LOG, async (data) => {
    cetSPLogger.log(data)
  })
}

export function initContentScriptRequest() {
  cetCSLogger.info('initContentScriptRequest')
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
}

export function initContentScriptTask(configures?: CetWorkFlowConfigure[]) {
  if (!configures) {
    return
  }
  onMsgInCS<CsFnParams>(EVENTS.SP2CS_EXECUTE_TASK, async (res) => {
    cetCSLogger.info('SP2CS_EXECUTE_TASK: ', serializeJSON(res))
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
