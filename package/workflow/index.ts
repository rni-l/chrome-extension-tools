/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:36
 * @LastEditTime: 2025-03-22 17:56:46
 * @LastEditors: Lu
 * @Description:
 */

import type { CetCsFnResultInTask, CetEventRemoveTabParams, CetLogEntry, CetWorkFlowConfigure, CsFnParams } from '../types'
import { cetBGLogger, cetCSLogger, cetSPLogger } from '../components/logger'
import { EVENTS } from '../constants'
import { onMsgInBG, onMsgInCS, onMsgInSP, sendMsgByCS } from '../message'
import { CetDestination } from '../types'
import { checkTabStatus, findDeepTargetByName, serializeJSON } from '../utils'

export * from './actuator'

export function initBackground() {
  cetBGLogger.info('initBackground')
  onMsgInBG<CetLogEntry>(EVENTS.CS2BG_LOG, async (data) => {
    console.log(EVENTS.CS2BG_LOG, data)
    cetBGLogger.log(data)
    return true
  })
  onMsgInBG<CetLogEntry>(EVENTS.SP2BG_LOG, async (data) => {
    cetBGLogger.log(data)
    return true
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, async () => {
    cetBGLogger.info('bg SP2BG_GET_CURRENT_TAB: ')
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    cetBGLogger.info('bg SP2BG_GET_CURRENT_TAB RESULT: ', serializeJSON(tabs))
    return tabs?.[0]
  })
  onMsgInBG<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, async () => {
    cetBGLogger.info('bg CS2BG_GET_CURRENT_TAB: ')
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    cetBGLogger.info('bg CS2BG_GET_CURRENT_TAB RESULT: ', serializeJSON(tabs))
    return tabs?.[0]
  })
  // sp 通知 bg 打开 url
  onMsgInBG<{ url: string }>(EVENTS.EVENT_OPEN_URL_SP2BG, async (data) => {
    chrome.tabs.create({ url: data.url })
  })
  // sp 通知 bg 刷新页面
  onMsgInBG<number>(EVENTS.EVENT_RELOAD_SP2BG, async (tabId) => {
    chrome.tabs.reload(tabId)
  })
  // sp 通知 bg 重定向 url
  onMsgInBG<{ url: string, tabId: number }>(EVENTS.EVENT_REDIRECT_URL_SP2BG, async (data) => {
    chrome.tabs.update(data.tabId, { url: data.url })
    return true
  })
  // sp 通知 bg 移除 tab
  onMsgInBG<CetEventRemoveTabParams>(EVENTS.EVENT_REMOVE_TAB_SP2BG, async (data) => {
    setTimeout(() => {
      chrome.tabs.remove(data.tabId)
    }, data.pending || 0)
  })
  // 获取 Cookie
  onMsgInBG<string>(EVENTS.EVENT_GET_COOKIES_SP2BG, async (domain) => {
    return new Promise((res) => {
      chrome.cookies.getAll({
        domain,
      }, (cookies) => {
        res(cookies)
      })
    })
  })
  // sp 通知 bg 检查 tab 状态
  onMsgInBG(EVENTS.EVENT_CHECK_TAB_STATUS_SP2BG, async (params: { tabId: number }) => {
    if (!params.tabId)
      return false
    const result = await checkTabStatus(params.tabId)
    return result
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

export async function initContentScriptTask(configures?: CetWorkFlowConfigure[]) {
  if (!configures) {
    return
  }
  onMsgInCS<CsFnParams>(EVENTS.SP2CS_EXECUTE_TASK, async (res) => {
    cetCSLogger.info('SP2CS_EXECUTE_TASK: ', serializeJSON(res))
    const target = findDeepTargetByName(configures, res.name)
    if (target && target.csFn) {
      const { data: tab } = await sendMsgByCS<undefined, chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG })
      const csResult = await target.csFn(res)
      if (!csResult) {
        return
      }
      return {
        data: csResult?.data,
        next: !!csResult?.next,
        retryTarget: csResult?.retryTarget,
        tabId: tab?.id,
        tabUrl: tab?.url,
      } as CetCsFnResultInTask
    }
    else {
      cetCSLogger.info('SP2CS_EXECUTE_TASK: ', res.name, ' not found')
      return { next: true }
    }
  })
}
