/*
 * @Author: Lu
 * @Date: 2025-02-05 17:02:05
 * @LastEditTime: 2025-03-04 15:37:31
 * @LastEditors: Lu
 * @Description:
 */
import type { CetWorkFlowConfigure } from './types'

export function asyncSetTimeout(time = 1000) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export async function loopCheck(fn: (times: number) => Promise<boolean>, maxTimes = 10, interval = 1000) {
  let times = 0
  let result = false
  while (times < maxTimes) {
    if (times > 0) {
      await asyncSetTimeout(interval)
    }
    result = await fn(times)
    if (result) {
      break
    }
    times++
  }
  return result
}

export function isExist(obj: any) {
  return obj !== undefined && obj !== null
}

export class SimpleStack {
  private stack: number[] = []
  push(item: number) {
    this.stack.push(item)
  }

  pop() {
    return this.stack.pop()
  }

  peek() {
    return this.stack[this.stack.length - 1]
  }

  peekAdd() {
    const t = this.stack[this.stack.length - 1]
    if (t !== undefined) {
      this.stack[this.stack.length - 1] = t + 1
    }
  }

  isEmpty() {
    return this.stack.length === 0
  }
}

export function findDeepTargetByName(configures: CetWorkFlowConfigure[], name: string) {
  let res: CetWorkFlowConfigure | undefined
  for (const item of configures) {
    if (item.name === name) {
      res = item
      break
    }
    if (item.children) {
      res = findDeepTargetByName(item.children, name)
      if (res)
        break
    }
  }
  return res
}

export function serializeJSON(v: any) {
  try {
    return JSON.stringify(v)
  }
  catch (e) {
    console.log('parse error', e)
    return v
  }
}

export function deserializeJSON(v: string) {
  try {
    return JSON.parse(v)
  }
  catch (e) {
    console.log('parse error', e)
    return v
  }
}

export function generateTenDigitRandom(max = 9999999999, min = 1000000000) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function injectInterceptRequest(jsPath: string, matches: string[]) {
  return new Promise((resolve) => {
    chrome.scripting.registerContentScripts([
      {
        id: 'intercept-request',
        js: [jsPath],
        world: 'MAIN',
        persistAcrossSessions: false,
        matches,
      },
    ], () => {
      resolve(true)
    })
  })
}
