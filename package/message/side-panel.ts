/*
 * @Author: Lu
 * @Date: 2025-02-20 22:00:08
 * @LastEditTime: 2025-03-03 17:07:32
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
import { configures } from '../constants'
import { CetDestination } from '../types'

const messageList: CetMessageEventItem[] = []

export function initSPMsgListener() {
  chrome.runtime.onMessage.addListener(
    (message: CetMessageItem, sender, sendResponse) => {
      if (configures.debug) {
        console.log('sp receive', message, sender)
      }
      const item = messageList.find(v => v.messageId === message.messageId)
      const destination = message.option.destination
      if (!destination) {
        throw new Error('destination is required')
      }
      if (item && item.spCallback) {
        item.spCallback(message.data, {
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
      else if (destination === CetDestination.SP) {
        // 处理 cs 发送，通过 bg 中转的消息
        const item2 = messageList.find(v => v.messageId === message.messageId)
        if (item2 && item2.spCallback) {
          item2.spCallback(message.data, {
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
          return
        }
      }
      else {
        return
      }

      return true // 异步响应
    },
  )
}
export function sendMsgBySP<T = unknown, R = unknown>(
  messageId: string,
  data: T | undefined,
  option: CetDestinationOption,
): Promise<CetMessageSendResult<R>> {
  return new Promise((res) => {
    if (configures.debug) {
      console.log('sendMsgBySP', messageId, data, option)
    }
    chrome.runtime.sendMessage({ messageId, data, option }, {}, (response: CetMessageCallbackResult<R>) => {
      if (configures.debug) {
        console.log('sp sendMsgBySP', response)
      }
      if (option.destination === CetDestination.CS) {
        // 因为会经过 bg，所以需要拆分数据
        const response2 = response.data as CetMessageCallbackResult<R>
        return res({
          data: response2?.data as R,
          tabId: option.tabId,
          messageId,
          success: response2?.success || false,
          msg: response2?.msg,
        })
      }
      res({
        data: response?.data as R,
        tabId: option.tabId,
        messageId,
        success: response?.success || false,
        msg: response?.msg,
      })
    })
  })
}
export function onMsgInSP<T = any>(messageId: string, spCallback: CetMessageCallback<T>) {
  const item = messageList.find(v => v.messageId === messageId)
  if (!item) {
    messageList.push({
      messageId,
      spCallback: spCallback as CetMessageCallback<unknown>,
    })
  }
  else {
    item.spCallback = spCallback as CetMessageCallback<unknown>
  }
}
