/*
 * @Author: Lu
 * @Date: 2025-02-05 17:02:05
 * @LastEditTime: 2025-02-05 17:30:23
 * @LastEditors: Lu
 * @Description:
 */
export function asyncSetTimeout(time = 1000) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export async function loopCheck(fn: () => Promise<boolean>, maxTimes = 10, interval = 1000) {
  let times = 0
  let result = false
  while (times < maxTimes) {
    if (times > 0) {
      await asyncSetTimeout(interval)
    }
    result = await fn()
    if (result) {
      break
    }
    times++
  }
  return result
}
