/*
 * @Author: Lu
 * @Date: 2025-01-24 10:28:18
 * @LastEditTime: 2025-03-04 11:24:07
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorCache, CetActuatorParams, CetActuatorResultItem, CetTaskRunOptions, CetWorkFlowConfigure } from '../types'
import type { CetTask, TCetTask } from './tasks'
import { SimpleStack } from '../utils'
import { findParentTask, findTaskByIndexPath, getTaskTree } from './tasks'

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
    let isCurrentChild = false // 当前节点是否子级
    let currentLevel = 1
    let isLoop = false // 当前节点是否循环
    const currentLoopIndexStack = new SimpleStack()
    while (targetTask) {
      if (targetTask.isRoot) {
        targetTask = targetTask.children[0]
        currentLevel = targetTask.level
        continue
      }
      const cache = actuatorCacheMap[targetTask.name]
      const tabId = await this.params.getTabId?.(targetTask, cache, options)
      if (tabId) {
        targetTask.setTabId(tabId)
      }
      const result = await targetTask.run(cache, options)
      if (cache.isRetry && !result) {
        cache.currentRetryNumber++
        if (cache.currentRetryNumber <= cache.retryNumber) {
          // TODO: 不同层级切换，需要初始化配置
          const retryTarget = findTaskByIndexPath(rootTask, nameMap[targetTask.configure.retryTarget!])
          if (!retryTarget) {
            throw new Error(`retryTargetIndex not found, ${targetTask.configure.retryTarget}`)
          }
          // 根据 name 找到对应的任务
          targetTask = retryTarget
          continue
        }
      }
      options.logItem && logs.push(options.logItem)
      // 失败，中断执行
      if (!result) {
        break
      }
      let nextTask: CetTask | undefined
      // 检查是否有子级
      if (targetTask.hasChildren) {
        // 开启循环
        isCurrentChild = true
        nextTask = targetTask.children[0]
      }
      else {
        nextTask = findTaskByIndexPath(rootTask, targetTask.nextTaskPath)
      }
      if (!nextTask) {
        // console.log('not found nextTask2', isLoop, currentLoopIndexStack.peek(), targetTask.parentLoopData!.length - 1)
        if (isLoop && (currentLoopIndexStack.peek() || 0) < targetTask.parentLoopData!.length - 1) {
          // 循环完毕，检查 loopIndex 是否在最后一个，如果不是则继续走
          // 如果是最后一个，则回到父级
          currentLoopIndexStack.peekAdd()
          nextTask = findTaskByIndexPath(rootTask, [...targetTask.indexPath.slice(0, -1), 0])!
        }
        else if (isCurrentChild && targetTask.isCurrentLast) {
          // 不会出现当前时子级 && 没有下一级 && 不是最后一个的情况
          // 检查当前是否循环 && 最后一个
          // 循环完毕，回到父级
          nextTask = findParentTask(rootTask, targetTask.indexPath.slice(0, -1))
          if (!nextTask) {
            break
          }
          isCurrentChild = nextTask.level !== 1
        }
        else {
          break
        }
      }
      // isLoop = !!nextTask.configure.loopData && nextTask.configure.loopData.length > 0
      isLoop = nextTask.isLoopItem
      // console.log(nextTask.name, isLoop)
      // 往下走
      if (currentLevel < nextTask.level) {
        // 切到下一级
        if (isLoop) {
          currentLoopIndexStack.push(0)
        }
      }
      else if (currentLevel > nextTask.level) {
        // 往上走
        if (isLoop) {
          currentLoopIndexStack.pop()
          // console.log('top parent', currentLoopIndexStack.peek(), nextTask.name)
        }
      }
      else {
        // 同级
      }
      if (isLoop) {
        // 找到当前的父级，父级肯定存在并且有 loopData
        options.currentLoopData = nextTask.parentLoopData![currentLoopIndexStack.peek()]
        options.currentLoopIndex = currentLoopIndexStack.peek()
      }
      currentLevel = nextTask.level
      targetTask = nextTask
    }
    this.params.callback?.(logs)
    console.log('end')
    return logs
  }
}
