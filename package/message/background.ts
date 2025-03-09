/*
 * @Author: Lu
 * @Date: 2025-02-20 21:59:55
 * @LastEditTime: 2025-03-06 15:27:12
 * @LastEditors: Lu
 * @Description:
 */
import type {
  CetDestinationOption,
  CetMessageCallback,
  CetMessageCallbackResult,
  CetMessageEventItem,
  CetMessageItem,
  CetMessageSendResult,
} from '../types'
import { cetBGLogger } from '../components/logger'
// import { configures } from '../constants'
import { CetDestination } from '../types'
import { checkIsNotLog, serializeJSON } from '../utils'

const messageList: CetMessageEventItem[] = []

export function sendMsgByBG<T = unknown, R = unknown>(
  messageId: string,
  data: T,
  option: CetDestinationOption,
): Promise<CetMessageSendResult<R>> {
  if (!option) {
    throw new Error('option is required')
  }
  if (checkIsNotLog(messageId)) {
    cetBGLogger.info('stat sendMsgByBG', messageId, serializeJSON(data), serializeJSON(option))
  }
  return new Promise((res) => {
    if (option.destination === CetDestination.CS) {
      if (!option.tabId) {
        console.error('tabId is required')
        return
      }
      // 发送给 content script 只能使用 chrome.tabs.sendMessage
      chrome.tabs.sendMessage(option.tabId, {
        messageId,
        data,
        option,
      } as CetMessageItem<T>, (response: CetMessageCallbackResult<R>) => {
        if (checkIsNotLog(messageId)) {
          cetBGLogger.info('sendMsgByBG response2', serializeJSON(response))
        }
        res({
          data: response?.data as R,
          messageId,
          tabId: option.tabId,
          success: response?.success || false,
          msg: response?.msg,
        })
      })
    }
    else {
      chrome.runtime.sendMessage({
        messageId,
        data,
        option,
      } as CetMessageItem<T>, (response: CetMessageCallbackResult<R>) => {
        if (checkIsNotLog(messageId)) {
          cetBGLogger.info('sendMsgByBG response', serializeJSON(response))
        }
        res({
          data: response?.data as R,
          messageId,
          tabId: option.tabId,
          success: response?.success || false,
          msg: response?.msg,
        })
      })
    }
  })
}
export function onMsgInBG<T = unknown>(name: string, cb: CetMessageCallback<T>) {
  const item = messageList.find(v => v.messageId === name)
  if (!item) {
    messageList.push({
      messageId: name,
      bgCallback: cb as CetMessageCallback<unknown>,
    })
  }
  else {
    console.warn('已经监听过相关事件，覆盖旧事件')
    item.bgCallback = cb as CetMessageCallback<unknown>
  }
}

export function initBGMsgListener() {
  chrome.runtime.onMessage.addListener(
    (message: CetMessageItem | any, sender, sendResponse) => {
      if (checkIsNotLog(message.messageId)) {
        cetBGLogger.info('bg receive', serializeJSON(message))
      }
      if (Object.prototype.toString.call(message) !== '[object Object]' || !message.messageId) {
        // 不是属于内置定义的 message，不处理
        return true
      }
      const msg = message as CetMessageItem
      const item = messageList.find(v => v.messageId === msg.messageId)
      // 中转事件，不需要在 background 中处理
      if (msg.option.destination === CetDestination.SP) {
        // 如果是发送给 sp，则不触发 background
        return true
      }
      else if (msg.option.destination === CetDestination.CS) {
        if (msg.option.tabId) {
          sendMsgByBG(msg.messageId, msg.data, msg.option)
            .then((res) => {
              if (checkIsNotLog(msg.messageId)) {
                cetBGLogger.info('sendMsgByBG response(cs)', res)
              }
              sendResponse({ data: res, success: true })
            })
        }
        else {
          console.warn('没有 tabId，不给 content script 发送消息')
          sendResponse({ msg: 'not have tabId', success: false })
          return false
        }
      }
      else if (item && item.bgCallback) {
        item.bgCallback(msg.data, {
          option: msg.option,
          messageId: msg.messageId,
        }).then((res) => {
          sendResponse({ data: res, success: true })
        }).catch((err) => {
          console.error('bgCallback error', err)
          sendResponse({ data: undefined, msg: err.message, success: false })
        })
      }
      else {
        console.warn('没有监听相关事件')
        return true
      }

      return true // 异步响应
    },
  )
}
