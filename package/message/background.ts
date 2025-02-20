/*
 * @Author: Lu
 * @Date: 2025-02-20 21:59:55
 * @LastEditTime: 2025-02-20 23:35:53
 * @LastEditors: Lu
 * @Description:
 */
import type { CetDestination, CetDestinationOption, CetMessageCallback, CetMessageEventItem, CetMessageItem } from '../types'

const messageList: CetMessageEventItem[] = []

export function sendMsgByBG<T = unknown>(messageId: string, data: T, destination?: CetDestination, option?: CetDestinationOption) {
  return new Promise((res) => {
    chrome.runtime.sendMessage({
      messageId,
      data,
      destination,
      tabId: option?.tabId,
      isToSP: destination === 'sp',
      isToCS: destination === 'cs',
    } as CetMessageItem<T>, (response: CetMessageItem) => {
      res(response)
    })
  })
}
export function onMsgInBG<T = unknown>(name: string, cb: CetMessageCallback<T>) {
  const item = messageList.find(v => v.messageId === name)
  if (!item) {
    messageList.push({
      messageId: name,
      tabIdList: [],
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
      if (Object.prototype.toString.call(message) !== '[object Object]' || !message.messageId) {
        // 不是属于内置定义的 message，不处理
        return true
      }
      const item = messageList.find(v => v.messageId === message.messageId)
      if (!item) {
        console.warn('没有监听相关事件')
        return true
      }
      if (message.isToSP) {
        // 如果是发送给 sp，则不触发 background
        sendMsgByBG(item.messageId, message.data, 'sp', { tabId: message.tabId }).then((t) => {
          sendResponse({
            data: t,
          })
        })
        return true
      }
      if (message.isToCS) {
        if (message.tabId) {
          chrome.tabs.sendMessage(message.tabId, message, (response) => {
            sendResponse(response)
          })
        }
        else {
          console.warn('没有 tabId，不给 content script 发送消息')
          return false
        }
      }
      else if (item.bgCallback) {
        item.bgCallback(message).then((res) => {
          sendResponse({
            data: res,
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
