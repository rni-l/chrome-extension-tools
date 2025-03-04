/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-03-04 11:13:14
 * @LastEditors: Lu
 * @Description:
 */

import type { CetWorkFlowConfigure, CsFnParams } from '../types'
import { configures, EVENTS } from '../constants'
import { onMsgInBG, onMsgInCS } from '../message'

export * from './actuator'

export function initService() {
  if (configures.debug) {
    console.log('initService')
  }
  onMsgInBG<chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, async (data, params) => {
    if (configures.debug) {
      console.log('bg SP2BG_GET_CURRENT_TAB', data, params)
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (configures.debug) {
      console.log('bg SP2BG_GET_CURRENT_TAB', tabs)
    }
    return tabs[0]
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, async (data, params) => {
    if (configures.debug) {
      console.log('bg CS2BG_GET_CURRENT_TAB', data, params)
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (configures.debug) {
      console.log('bg CS2BG_GET_CURRENT_TAB', tabs)
    }
    return tabs[0]
  })
}

export function initContentScript(configures: CetWorkFlowConfigure[]) {
  console.log('initContentScript')
  onMsgInCS<CsFnParams>(EVENTS.SP2CS_EXECUTE_TASK, async (res) => {
    console.log('SP2CS_EXECUTE_TASK', res)
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
