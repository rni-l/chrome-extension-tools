/*
 * @Author: Lu
 * @Date: 2025-02-05 17:02:05
 * @LastEditTime: 2025-02-10 23:11:05
 * @LastEditors: Lu
 * @Description:
 */
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
