/*
 * @Author: Lu
 * @Date: 2025-02-20 21:59:59
 * @LastEditTime: 2025-03-05 14:45:06
 * @LastEditors: Lu
 * @Description:
 */

import type {
  CetDestinationOption,
  CetMessageCallbackResult,
  CetMessageCsCallback,
  CetMessageEventItem,
  CetMessageItem,
  CetMessageSendResult,
} from '../types'
import { cetCSLogger } from '../components/logger'
import { checkIsNotLog, serializeJSON } from '../utils'

const messageList: CetMessageEventItem[] = []

export function initCSMsgListener() {
  console.log('initCSMsgListener')
  chrome.runtime.onMessage.addListener(
    (message: CetMessageItem, sender, sendResponse) => {
      if (checkIsNotLog(message.messageId)) {
        cetCSLogger.info('cs receive', serializeJSON(message))
      }
      if (Object.prototype.toString.call(message) !== '[object Object]' || !message.messageId) {
        // 不是属于内置定义的 message，不处理
        return true
      }
      const item = messageList.find(v => v.messageId === message.messageId)
      if (!item || !item.csCallback) {
        console.warn('没有监听相关事件')
        return true
      }
      if (item && item.csCallback) {
        item.csCallback(message.data, {
          option: message.option,
          messageId: message.messageId,
        }).then((res) => {
          sendResponse({
            data: res,
            success: true,
          })
        }).catch((err) => {
          sendResponse({
            data: undefined,
            success: false,
            msg: err.message,
          })
        })
      }
      else {
        return false
      }

      return true // 异步响应
    },
  )
}
export function sendMsgByCS<T = unknown, R = unknown>(
  messageId: string,
  data: T,
  option: CetDestinationOption,
): Promise<CetMessageSendResult<R>> {
  return new Promise((res) => {
    console.log(messageId)
    if (checkIsNotLog(messageId)) {
      cetCSLogger.info('cs sendMsgByCS', messageId, serializeJSON(data), serializeJSON(option))
    }
    chrome.runtime.sendMessage({ messageId, data, option }, {}, (response: CetMessageCallbackResult<R>) => {
      if (checkIsNotLog(messageId)) {
        cetCSLogger.info('cs sendMsgByCS response', messageId, serializeJSON(response))
      }
      res({
        data: response?.data as R,
        tabId: option.tabId,
        tabUrl: option.tabUrl,
        messageId,
        success: response?.success || false,
        msg: response?.msg,
      })
    })
  })
}
export function onMsgInCS<T = unknown>(messageId: string, csCallback: CetMessageCsCallback<T>, tabId?: number) {
  const item = messageList.find(v => v.messageId === messageId)
  if (!item) {
    messageList.push({
      messageId,
      csCallback: csCallback as CetMessageCsCallback<unknown>,
    })
  }
  else {
    item.csCallback = csCallback as CetMessageCsCallback<unknown>
  }
  return true
}
