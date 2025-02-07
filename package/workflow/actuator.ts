/*
 * @Author: Lu
 * @Date: 2025-01-24 10:28:18
 * @LastEditTime: 2025-02-07 23:51:22
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorCache, CetActuatorParams, CetActuatorResultItem, CetTaskRunOptions, CetWorkFlowConfigure } from 'package/types'
import type { TCetTask } from './tasks'
import { findTaskByIndexPath, getTaskTree } from './tasks'

const C_NEXT_TIME = 1000 * 1 * 60

export class CetActuator {
  configures: CetWorkFlowConfigure[]
  params: CetActuatorParams
  constructor(conConfigure: CetWorkFlowConfigure[], conParams?: CetActuatorParams) {
    this.configures = conConfigure
    this.params = conParams || { nextTime: C_NEXT_TIME }
  }

  getActuatorCache(configures: CetWorkFlowConfigure[]): Record<string, CetActuatorCache> {
    return configures.reduce((pre: Record<string, CetActuatorCache>, cur) => {
      pre[cur.name] = {
        name: cur.name,
        retryNumber: cur.retryNumber || 0,
        currentRetryNumber: 0,
        isRetry: !!cur.retryTarget,
      }
      if (cur.children) {
        Object.assign(pre, this.getActuatorCache(cur.children))
      }
      return pre
    }, {})
  }

  getRetryTargetIndex(name: string) {
    return this.configures.findIndex((step) => {
      return step.name === name
    })
  }

  checkIsSameName(targetConfigures: CetWorkFlowConfigure[], obj: Record<string, boolean> = {}): boolean {
    return targetConfigures.some((v) => {
      if (obj[v.name]) {
        return true
      }
      else {
        obj[v.name] = true
        if (v.children) {
          return this.checkIsSameName(v.children, obj)
        }
        return false
      }
    })
  }

  findConfigureByName(name: string) {
    // 深度查询
    let result: CetWorkFlowConfigure | undefined
    this.configures.some((step) => {
      if (step.name === name) {
        result = step
        return true
      }
      else if (step.children) {
        return this.findConfigureByName(name)
      }
      return false
    })
    return result
  }

  async run(): Promise<CetActuatorResultItem[]> {
    if (this.checkIsSameName(this.configures)) {
      console.log('error')
      throw new Error('name 不能重复')
    }
    const logs: CetActuatorResultItem[] = []
    const options: CetTaskRunOptions = {
      logItem: undefined,
    }
    const actuatorCacheMap = this.getActuatorCache(this.configures)
    // const tasks = this.getTasks(options)
    // const targetConfigureName = this.configures[0].name
    const { rootTask, nameMap } = getTaskTree(this.configures)
    let targetTask: TCetTask | undefined = rootTask
    console.log(targetTask)
    while (true) {
      if (!targetTask) {
        break
      }
      if (targetTask.isRoot) {
        targetTask = targetTask.children[0]
        continue
      }
      else {
        const cache = actuatorCacheMap[targetTask.name]
        const result = await targetTask.run(cache, options)
        if (cache.isRetry && !result) {
          cache.currentRetryNumber++
          if (cache.currentRetryNumber <= cache.retryNumber) {
            // TODO: 不同层级切换
            const retryTarget = findTaskByIndexPath(rootTask, nameMap[targetTask.configure.retryTarget!])
            if (!retryTarget) {
              throw new Error(`retryTargetIndex not found, ${targetTask.configure.retryTarget}`)
            }
            // 根据 name 找到对应的任务
            targetTask = retryTarget
            // targetConfigureName = retryTarget.name
            // const retryTargetIndex = this.getRetryTargetIndex(configure.retryTarget!)
            // if (retryTargetIndex < 0) {
            //   throw new Error(`retryTargetIndex not found, ${configure.retryTarget}`)
            // }
            // i = retryTargetIndex
            continue
          }
        }
        options.logItem && logs.push(options.logItem)
        // 失败，中断执行
        if (!result) {
          break
        }
        // 检查是否有子级
        targetTask = findTaskByIndexPath(rootTask, targetTask.nextTaskPath)
        if (!targetTask)
          break
      }
    }
    // while (targetConfigureName) {
    //   const configure = this.findConfigureByName(targetConfigureName)
    //   if (!configure) {
    //     throw new Error(`targetConfigureName not found, ${targetConfigureName}`)
    //   }
    //   const cache = actuatorCacheMap[targetConfigureName]
    //   // const result = await tasks[i](cache)
    //   const result = await this.getTask(configure, options)(cache)
    //   if (cache.isRetry && !result) {
    //     cache.currentRetryNumber++
    //     if (cache.currentRetryNumber <= cache.retryNumber) {
    //       // TODO: 不同层级切换
    //       const retryTarget = this.findConfigureByName(configure.retryTarget!)
    //       if (!retryTarget) {
    //         throw new Error(`retryTargetIndex not found, ${configure.retryTarget}`)
    //       }
    //       targetConfigureName = retryTarget.name
    //       // const retryTargetIndex = this.getRetryTargetIndex(configure.retryTarget!)
    //       // if (retryTargetIndex < 0) {
    //       //   throw new Error(`retryTargetIndex not found, ${configure.retryTarget}`)
    //       // }
    //       // i = retryTargetIndex
    //       continue
    //     }
    //   }
    //   options.logItem && logs.push(options.logItem)
    //   // 失败，中断执行
    //   if (!result) {
    //     break
    //   }
    //   // 检查是否有子级
    // }
    this.params.callback?.(logs)
    return logs
  }
}
