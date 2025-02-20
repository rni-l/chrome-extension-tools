/*
 * @Author: Lu
 * @Date: 2025-02-20 21:59:59
 * @LastEditTime: 2025-02-20 23:42:03
 * @LastEditors: Lu
 * @Description:
 */

import type { CetMessageCsCallback, CetMessageEventItem, CetMessageItem } from '../types'

const messageList: CetMessageEventItem[] = []

export function initCSMsgListener() {
  console.log('initCSMsgListener')
  chrome.runtime.onMessage.addListener(
    (message: CetMessageItem, sender, sendResponse) => {
      if (Object.prototype.toString.call(message) !== '[object Object]' || !message.messageId) {
        // 不是属于内置定义的 message，不处理
        return true
      }
      const item = messageList.find(v => v.messageId === message.messageId)
      if (!item) {
        console.warn('没有监听相关事件')
        return true
      }
      if (item) {
        const tabItem = item.tabIdList?.find(v => v.tabId === message.tabId)
        if (tabItem && tabItem.csCallback && message.tabId) {
          tabItem.csCallback(message, message.tabId).then((res) => {
            sendResponse({
              data: res,
              tabId: message.tabId,
            })
          })
        }
        else {
          return false
        }
      }
      else {
        return false
      }

      return true // 异步响应
    },
  )
}
export function sendMsgByCS<T = unknown>(type: string, data: any, tabId?: number, isToSP?: boolean): Promise<CetMessageItem<T>> {
  return new Promise((res) => {
    chrome.runtime.sendMessage({ type, data, tabId, isToSP }, {}, (response: CetMessageItem) => {
      res(response as CetMessageItem<T>)
    })
  })
}
export function onMsgInCS<T = unknown>(messageId: string, tabId: number, csCallback: CetMessageCsCallback<T>) {
  const item = messageList.find(v => v.messageId === messageId)
  if (!item) {
    messageList.push({
      messageId,
      tabIdList: [{
        tabId,
        csCallback: csCallback as CetMessageCsCallback<unknown>,
      }],
    })
  }
  else {
    const tabItem = item.tabIdList.find(v => v.tabId === tabId)
    if (tabItem) {
      item.csCallback = csCallback as CetMessageCsCallback<unknown>
    }
    else {
      item.tabIdList.push({ tabId, csCallback: csCallback as CetMessageCsCallback<unknown> })
    }
  }
  return true
}
