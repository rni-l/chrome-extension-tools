/*
 * @Author: Lu
 * @Date: 2025-01-24 10:28:18
 * @LastEditTime: 2025-02-05 17:50:57
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorCache, CetActuatorParams, CetActuatorResultItem, CetWorkFlowConfigure, CsFnResult, SpFnResult } from 'package/types'
import { loopCheck } from 'package/utils'

const C_NEXT_TIME = 1000 * 1 * 60

function getCommonSpResult(): SpFnResult {
  return {
    next: true,
  }
}
function getCommonCsResult(): CsFnResult {
  return {
    next: true,
  }
}

export class Actuator {
  configures: CetWorkFlowConfigure[]
  params: CetActuatorParams
  constructor(conConfigure: CetWorkFlowConfigure[], conParams?: CetActuatorParams) {
    this.configures = conConfigure
    this.params = conParams || { nextTime: C_NEXT_TIME }
  }

  getActuatorCache(configure: CetWorkFlowConfigure): CetActuatorCache {
    return {
      name: configure.name,
      retryNumber: configure.retryNumber || 0,
      currentRetryNumber: 0,
      isRetry: !!configure.retryNumber && !!configure.retryTarget,
    }
  }

  getRetryTargetIndex(name: string) {
    return this.configures.findIndex((step) => {
      return step.name === name
    })
  }

  checkIsSameName() {
    const obj: Record<string, boolean> = {}
    return this.configures.some((v) => {
      if (obj[v.name]) {
        return true
      }
      else {
        obj[v.name] = true
        return false
      }
    })
  }

  async run(): Promise<CetActuatorResultItem[]> {
    if (this.checkIsSameName()) {
      console.log('error')
      throw new Error('name 不能重复')
    }
    const logs: CetActuatorResultItem[] = []
    let logItem: CetActuatorResultItem | undefined
    const actuatorCacheList: CetActuatorCache[] = this.configures.map((step) => {
      return this.getActuatorCache(step)
    })
    const tasks = this.configures.map((step) => {
      return async () => {
        logItem = {
          name: step.name,
          success: false,
        }
        const spBeforeResult: SpFnResult = step.spBeforeFn
          ? await step.spBeforeFn({
            isFirstLevel: true,
          })
          : getCommonSpResult()
        logItem.spBeforeFn = spBeforeResult
        if (!spBeforeResult || !spBeforeResult.next) {
          return false
        }
        let csResult: CsFnResult = getCommonCsResult()
        if (step.csFn) {
          await loopCheck(async () => {
            csResult = await step.csFn!({
              isFirstLevel: true,
              spBeforeFnResult: spBeforeResult,
            })
            return csResult.next
          }, (step.csRetryNumber || 0) + 1, step.csRetryInterval || 1000)
        }
        logItem.csFn = csResult
        if (!csResult || (!csResult.next && !step.skipCsCallbackFail)) {
          return false
        }
        const spAfterResult: SpFnResult = step.spAfterFn
          ? await step.spAfterFn({
            isFirstLevel: true,
            csFnResult: csResult,
          })
          : getCommonSpResult()
        logItem.spAfterFn = spAfterResult
        if (!spAfterResult || !spAfterResult.next) {
          return false
        }
        logItem.success = true
        return true
      }
    })
    let i = 0
    while (i < tasks.length) {
      const result = await tasks[i]()
      if (actuatorCacheList[i].isRetry && !result) {
        actuatorCacheList[i].currentRetryNumber++
        if (actuatorCacheList[i].currentRetryNumber <= actuatorCacheList[i].retryNumber) {
          const retryTargetIndex = this.getRetryTargetIndex(this.configures[i].retryTarget!)
          if (retryTargetIndex < 0) {
            throw new Error(`retryTargetIndex not found, ${this.configures[i].retryTarget}`)
          }
          i = retryTargetIndex
          continue
        }
      }
      logItem && logs.push(logItem)
      if (!result) {
        break
      }
      i++
    }
    this.params.callback?.(logs)
    return logs
  }
}
