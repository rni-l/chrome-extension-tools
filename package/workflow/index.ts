/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-03-06 16:30:27
 * @LastEditors: Lu
 * @Description:
 */

import type { CetLogEntry, CetWorkFlowConfigure, CsFnParams } from '../types'
import { cetBGLogger, cetCSLogger, cetSPLogger } from '../components/logger'
import { EVENTS } from '../constants'
import { onMsgInBG, onMsgInCS, onMsgInSP, sendMsgByCS } from '../message'
import { CetDestination } from '../types'
import { findDeepTargetByName, serializeJSON } from '../utils'

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
      const res = (event.data.data)
      // const item = {
      //   url: res.url,
      //   response: res,
      //   data: res.data,
      //   requestType: event.data.data.requestType,
      //   id: generateTenDigitRandom(),
      // }
      sendMsgByCS(EVENTS.CS2SP_GET_REQUEST, res, { destination: CetDestination.SP })
      sendMsgByCS(EVENTS.CS2BG_GET_REQUEST, res, { destination: CetDestination.BG })
    }
  }, false)
}

export function initContentScriptTask(configures?: CetWorkFlowConfigure[]) {
  if (!configures) {
    return
  }
  onMsgInCS<CsFnParams>(EVENTS.SP2CS_EXECUTE_TASK, async (res) => {
    cetCSLogger.info('SP2CS_EXECUTE_TASK: ', serializeJSON(res))
    const target = findDeepTargetByName(configures, res.name)
    if (target && target.csFn) {
      const csResult = await target.csFn(res)
      return csResult
    }
    else {
      cetCSLogger.info('SP2CS_EXECUTE_TASK: ', res.name, ' not found')
      return { next: true }
    }
  })
}
