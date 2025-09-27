/*
 * @Author: Lu
 * @Date: 2025-01-24 10:28:18
 * @LastEditTime: 2025-08-06 10:35:13
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorCache, CetActuatorOneResult, CetActuatorParams, CetActuatorResult, CetActuatorResultLogItem, CetActuatorRunOptions, CetTaskRunOptions, CetWorkFlowConfigure } from '../types'
import type { CetTask, TCetTask } from './tasks'
import { filterConfigures, SimpleStack } from '../utils'
import { findParentTask, findTaskByIndexPath, getTaskTree } from './tasks'

const C_NEXT_TIME = 1000 * 1 * 60

interface IExecuteOptions {
  targetTask: TCetTask | undefined
  isCurrentChild: boolean
  currentLevel: number
  isLoop: boolean
  success: boolean
  currentLoopIndexStack: SimpleStack
  logs: CetActuatorResultLogItem[]
  actuatorCacheMap: Record<string, CetActuatorCache>
  options: CetTaskRunOptions
}

export class CetActuator {
  configures: CetWorkFlowConfigure[]
  params: CetActuatorParams
  executeOptions: IExecuteOptions = {
    targetTask: undefined,
    isCurrentChild: false, // 当前节点是否子级
    currentLevel: 1,
    isLoop: false,
    success: true,
    currentLoopIndexStack: new SimpleStack(),
    logs: [],
    actuatorCacheMap: {},
    options: {
      logItem: undefined,
      userOption: {},
    },
  }

  isRunning = false

  constructor(conConfigure: CetWorkFlowConfigure[], conParams?: CetActuatorParams) {
    this.configures = filterConfigures(conConfigure)
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

  resetOptions() {
    this.executeOptions.logs = []
    this.executeOptions.actuatorCacheMap = {}
    this.executeOptions.targetTask = undefined
    this.executeOptions.isCurrentChild = false // 当前节点是否子级
    this.executeOptions.currentLevel = 1
    this.executeOptions.isLoop = false // 当前节点是否循环
    this.executeOptions.success = true
    this.executeOptions.currentLoopIndexStack = new SimpleStack()
  }

  async execute(rootTask: CetTask, nameMap: Record<string, number[]>, runOptions?: CetActuatorRunOptions) {
    const targetTask = this.executeOptions.targetTask
    const options = this.executeOptions.options
    if (!targetTask)
      return false
    if (targetTask.isRoot) {
      this.executeOptions.targetTask = targetTask.children[0]
      this.executeOptions.currentLevel = targetTask.level
      return true
    }
    const cache = this.executeOptions.actuatorCacheMap[targetTask.name]
    const tabId = await this.params.getTabId?.(targetTask, cache, options)
    if (tabId) {
      targetTask.setTabId(tabId)
    }
    this.params.taskBeforeCb?.(targetTask, cache, options)
    const isRunOk = await targetTask.run(cache, options)
    this.params.taskAfterCb?.(targetTask, isRunOk, options.logItem)
    if (cache.isRetry && !isRunOk) {
      cache.currentRetryNumber++
      if (cache.currentRetryNumber <= cache.retryNumber) {
        // TODO: 不同层级切换，需要初始化配置
        const retryTarget = findTaskByIndexPath(rootTask, nameMap[targetTask.configure.retryTarget!])
        if (!retryTarget) {
          throw new Error(`retryTargetIndex not found, ${targetTask.configure.retryTarget}`)
        }
        // 根据 name 找到对应的任务
        this.executeOptions.targetTask = retryTarget
        return true
      }
    }
    options.logItem && this.executeOptions.logs.push(options.logItem)
    // 失败
    // 如果配置了 skipLoopFail = true 并且当前是子层级的，则不中断执行
    const isSkipLoopFail = !!runOptions?.skipLoopFail && this.executeOptions.isLoop
    if (!isSkipLoopFail && !isRunOk) {
      this.executeOptions.success = false
      return false
    }
    let nextTask: CetTask | undefined
    if (isRunOk) {
      // 检查是否有子级
      if (targetTask.hasChildren) {
        // 开启循环
        this.executeOptions.isCurrentChild = true
        nextTask = targetTask.children[0]
      }
      else {
        nextTask = findTaskByIndexPath(rootTask, targetTask.nextTaskPath)
      }
      // 如果找不到 nextTask，则会检查，下面检查还是没有的话，就会终止循环
      if (!nextTask) {
        // console.log('not found nextTask2', isLoop, currentLoopIndexStack.peek(), targetTask.parentLoopData!.length - 1)
        if (this.executeOptions.isLoop && (this.executeOptions.currentLoopIndexStack.peek() || 0) < targetTask.parentLoopData!.length - 1) {
          // 循环完毕，检查 loopIndex 是否在最后一个，如果不是则继续走
          // 如果是最后一个，则回到父级
          this.executeOptions.currentLoopIndexStack.peekAdd()
          nextTask = findTaskByIndexPath(rootTask, [...targetTask.indexPath.slice(0, -1), 0])!
        }
        else if (this.executeOptions.isCurrentChild && targetTask.isCurrentLast) {
          // 不会出现当前时子级 && 没有下一级 && 不是最后一个的情况
          // 检查当前是否循环 && 最后一个
          // 循环完毕，回到父级
          nextTask = findParentTask(rootTask, targetTask.indexPath.slice(0, -1))
          if (!nextTask) {
            return false
          }
          this.executeOptions.isCurrentChild = nextTask.level !== 1
        }
        else {
          return false
        }
      }
    }
    else if (isSkipLoopFail) {
      // 执行失败，但配置了 skipLoopFail = true
      // 直接找到当前循环节点的父级
      if ((this.executeOptions.currentLoopIndexStack.peek() || 0) < targetTask.parentLoopData!.length - 1) {
        // 循环完毕，检查 loopIndex 是否在最后一个，如果不是则继续走
        // 如果是最后一个，则回到父级
        this.executeOptions.currentLoopIndexStack.peekAdd()
        nextTask = findTaskByIndexPath(rootTask, [...targetTask.indexPath.slice(0, -1), 0])!
      }
      else {
        // 不会出现当前时子级 && 没有下一级 && 不是最后一个的情况
        // 检查当前是否循环 && 最后一个
        // 循环完毕，回到父级
        nextTask = findParentTask(rootTask, targetTask.indexPath.slice(0, -1))
        if (!nextTask) {
          this.executeOptions.success = false
          return false
        }
        this.executeOptions.isCurrentChild = nextTask.level !== 1
      }
    }
    // console.log(nextTask?.name, nextTask?.isLoopItem)
    if (!nextTask) {
      this.executeOptions.success = false
      return false
    }
    this.executeOptions.isLoop = nextTask.isLoopItem
    // console.log(nextTask.name, isLoop)
    // 往下走
    if (this.executeOptions.currentLevel < nextTask.level) {
      // 切到下一级
      if (this.executeOptions.isLoop) {
        this.executeOptions.currentLoopIndexStack.push(0)
      }
    }
    else if (this.executeOptions.currentLevel > nextTask.level) {
      // 往上走
      if (this.executeOptions.isLoop) {
        this.executeOptions.currentLoopIndexStack.pop()
        // console.log('top parent', currentLoopIndexStack.peek(), nextTask.name)
      }
    }
    else {
      // 同级
    }
    if (this.executeOptions.isLoop) {
      // 找到当前的父级，父级肯定存在并且有 loopData
      options.currentLoopData = nextTask.parentLoopData![this.executeOptions.currentLoopIndexStack.peek()]
      options.currentLoopIndex = this.executeOptions.currentLoopIndexStack.peek()
    }
    this.executeOptions.currentLevel = nextTask.level
    this.executeOptions.targetTask = nextTask
    return true
  }

  async runOne(runOptions?: CetActuatorRunOptions, userOption?: Record<string, any>): Promise<CetActuatorOneResult> {
    const { rootTask, nameMap } = getTaskTree(this.configures)
    if (!this.isRunning) {
      // 第一次执行，则初始化选项
      if (this.checkIsSameName(this.configures)) {
        throw new Error('name 不能重复')
      }
      this.executeOptions.logs = []
      this.executeOptions.options = {
        logItem: undefined,
        userOption,
      }
      this.executeOptions.actuatorCacheMap = this.getActuatorCache(this.configures)
      // 初始化变亮
      this.executeOptions.targetTask = rootTask
      this.executeOptions.isCurrentChild = false // 当前节点是否子级
      this.executeOptions.currentLevel = 1
      this.executeOptions.isLoop = false // 当前节点是否循环
      this.executeOptions.success = true
      this.executeOptions.currentLoopIndexStack = new SimpleStack()
      this.isRunning = true
    }
    // console.log('runOne ----- ', this.executeOptions.targetTask?.name)
    const next = await this.execute(rootTask, nameMap, runOptions)
    if (!next) {
      this.params.callback?.(this.executeOptions.logs)
      const outputLogs = this.executeOptions.logs
      const success = this.executeOptions.success
      this.resetOptions()
      this.isRunning = false
      return {
        logs: outputLogs,
        success,
        isEnd: true,
      }
    }
    return {
      logs: this.executeOptions.logs,
      success: this.executeOptions.success,
      isEnd: false,
    }
  }

  async run(runOptions?: CetActuatorRunOptions, userOption?: Record<string, any>): Promise<CetActuatorResult> {
    if (this.checkIsSameName(this.configures)) {
      throw new Error('name 不能重复')
    }
    this.executeOptions.logs = []
    this.executeOptions.options = {
      logItem: undefined,
      userOption,
    }
    this.executeOptions.actuatorCacheMap = this.getActuatorCache(this.configures)
    const { rootTask, nameMap } = getTaskTree(this.configures)
    // 初始化变亮
    this.executeOptions.targetTask = rootTask
    this.executeOptions.isCurrentChild = false // 当前节点是否子级
    this.executeOptions.currentLevel = 1
    this.executeOptions.isLoop = false // 当前节点是否循环
    this.executeOptions.success = true
    this.executeOptions.currentLoopIndexStack = new SimpleStack()
    while (this.executeOptions.targetTask) {
      const res = await this.execute(rootTask, nameMap, runOptions)
      if (!res) {
        break
      }
    }
    this.params.callback?.(this.executeOptions.logs)
    const outputLogs = this.executeOptions.logs
    const success = this.executeOptions.success
    this.resetOptions()
    return {
      logs: outputLogs,
      success,
    }
  }
}
