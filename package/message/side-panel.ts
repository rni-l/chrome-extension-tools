/*
 * @Author: Lu
 * @Date: 2025-02-20 22:00:08
 * @LastEditTime: 2025-02-20 23:43:57
 * @LastEditors: Lu
 * @Description:
 */

import type { CetMessageCallback, CetMessageEventItem, CetMessageItem } from '../types'

const messageList: CetMessageEventItem[] = []

export function initSPMsgListener() {
  chrome.runtime.onMessage.addListener(
    (message: CetMessageItem, sender, sendResponse) => {
      const item = messageList.find(v => v.messageId === message.messageId)
      if (item && item.spCallback) {
        item.spCallback(message).then((res) => {
          sendResponse({
            data: res,
            tabId: message.tabId,
          })
        })
      }
      else if (message.isToSP) {
        // 处理 cs 发送，通过 bg 中转的消息
        const item2 = messageList.find(v => v.messageId === message.messageId)
        if (item2 && item2.spCallback) {
          item2.spCallback(message).then((res) => {
            sendResponse({
              data: res,
              tabId: message.tabId,
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
export function sendMsgBySP<T = any>(type: string, data: any, tabId?: number, isToCS?: boolean): Promise<CetMessageItem<T>> {
  return new Promise((res) => {
    chrome.runtime.sendMessage({ type, data, tabId, isToCS }, {}, (response: CetMessageItem<T>) => {
      res(response)
    })
  })
}
export function onMsgInSP<T = any>(messageId: string, spCallback: CetMessageCallback<T>) {
  const item = messageList.find(v => v.messageId === messageId)
  if (!item) {
    messageList.push({
      messageId,
      tabIdList: [],
      spCallback: spCallback as CetMessageCallback<unknown>,
    })
  }
  else {
    item.spCallback = spCallback as CetMessageCallback<unknown>
  }
}
