/*
 * @Author: Lu
 * @Date: 2025-02-07 17:44:15
 * @LastEditTime: 2025-03-04 11:18:52
 * @LastEditors: Lu
 * @Description:
 */

import type {
  CetActuatorCache,
  CetCommonParams,
  CetCsFnResult,
  CetLoopDataItem,
  CetSpFnResult,
  CetTaskRunOptions,
  CetWorkFlowConfigure,
  CsFnParams,
} from '../types'
import { EVENTS } from '../constants'
import { sendMsgBySP } from '../message'
import { CetDestination } from '../types'
import { isExist, loopCheck } from '../utils'

function getCommonSpResult(): CetSpFnResult {
  return {
    next: true,
  }
}
function getCommonCsResult(): CetCsFnResult {
  return {
    next: true,
  }
}
interface ICheckOptions {
  isRoot?: boolean
  isCurrentLast?: boolean
  parentLoopData?: CetLoopDataItem[]
}
export class CetTask {
  configure: CetWorkFlowConfigure
  name = ''
  tabId = 0
  children: CetTask[] = []
  indexPath: number[] = []
  level = 0
  nextTaskPath: number[] = []
  hasChildren = false
  isRoot = false
  isCurrentLast = false
  isLoopItem = false
  parentLoopData: CetLoopDataItem[] = []

  constructor(configure: CetWorkFlowConfigure, path: number[], checkOptions: ICheckOptions = {}) {
    this.name = configure.name
    this.configure = configure
    this.indexPath = path
    this.level = path.length
    const pathLen = path.length - 1
    this.nextTaskPath = path.map((v, i) => {
      if (i === pathLen)
        return path[pathLen] + 1
      return v
    })
    this.hasChildren = !!configure.children?.length
    this.isRoot = !!checkOptions.isRoot
    this.isCurrentLast = !!checkOptions.isCurrentLast
    this.isLoopItem = !!checkOptions.parentLoopData?.length
    this.parentLoopData = checkOptions.parentLoopData || []
  }

  setTabId(tabId: number) {
    this.tabId = tabId
  }

  appendChildren(children: CetTask[]) {
    this.children = children
    this.hasChildren = children.length > 0
  }

  async run(currentCache: CetActuatorCache, options: CetTaskRunOptions) {
    const configure = this.configure
    options.logItem = {
      name: configure.name,
      success: false,
    }
    const commonParams: CetCommonParams = { isFirstLevel: true, name: this.name }
    if (currentCache.isRetry && currentCache.currentRetryNumber > 0) {
      commonParams.retryNumber = currentCache.currentRetryNumber
    }
    if (isExist(options.currentLoopData)) {
      commonParams.currentLoopData = options.currentLoopData
      commonParams.currentLoopIndex = options.currentLoopIndex
    }
    const spBeforeResult: CetSpFnResult = configure.spBeforeFn
      ? await configure.spBeforeFn(commonParams)
      : getCommonSpResult()
    options.logItem.spBeforeFn = spBeforeResult
    if (!spBeforeResult || !spBeforeResult.next) {
      return false
    }
    const csResult: CetCsFnResult = getCommonCsResult()
    if (configure.csFn) {
      await loopCheck(async (number) => {
        const msgResult = await sendMsgBySP<CsFnParams, CetCsFnResult>(EVENTS.SP2CS_EXECUTE_TASK, {
          ...commonParams,
          spBeforeFnResult: spBeforeResult,
          csRetryNumber: number,
          tabId: this.tabId,
        }, {
          destination: CetDestination.CS,
          tabId: this.tabId,
        })
        console.log('msgResult', msgResult)
        csResult.tabId = msgResult.tabId
        // TODO：获取 tabUrl
        csResult.tabUrl = msgResult.tabUrl
        csResult.data = msgResult.data
        csResult.next = msgResult.success
        return csResult.next
      }, (configure.csRetryNumber || 0) + 1, configure.csRetryInterval || 1000)
    }
    options.logItem.csFn = csResult
    if (!csResult || (!csResult.next && !configure.skipCsCallbackFail)) {
      return false
    }
    const spAfterResult: CetSpFnResult = configure.spAfterFn
      ? await configure.spAfterFn({
        ...commonParams,
        csFnResult: csResult,
      })
      : getCommonSpResult()
    options.logItem.spAfterFn = spAfterResult
    if (!spAfterResult || !spAfterResult.next) {
      return false
    }
    options.logItem.success = true
    return true
  }
}

export function getTaskTrees(configures: CetWorkFlowConfigure[], parentPath: number[] = [], nameMap: Record<string, number[]>, parentTask?: CetTask) {
  const trees: CetTask[] = configures.map((configure, i) => {
    const isCurrentLast = i === configures.length - 1
    const tree = new CetTask(configure, [...parentPath, i], {
      isCurrentLast,
      parentLoopData: parentTask?.configure?.loopData || [],
    })
    nameMap[configure.name] = tree.indexPath
    if (configure.children) {
      tree.children = getTaskTrees(configure.children, [...parentPath, i], nameMap, tree)
    }
    return tree
  })
  return trees
}

export function getTaskTree(configures: CetWorkFlowConfigure[]) {
  const nameMap: Record<string, number[]> = {}
  const rootTask = new CetTask({ name: 'root', children: [] }, [], { isRoot: true })
  rootTask.appendChildren(getTaskTrees(configures, [], nameMap))
  return { rootTask, nameMap }
}

export type TCetTask = InstanceType<typeof CetTask>

export function findTaskByIndexPath(task: TCetTask, indexPath: number[]) {
  if (!indexPath.length)
    return undefined
  try {
    let t: TCetTask | undefined = task
    const tmp = [...indexPath]
    // console.log(tmp)
    for (let index = 0; index < tmp.length; index++) {
      t = t.children[tmp[index]]
      // console.log('t', t, tmp[index], index)
    }
    return t
  }
  catch (e) {
    console.log(e)
    return undefined
  }
}

/**
 * 逐层往上找
 * 找到目标后，查看当前目标是否有下一级
 * 如果有则返回
 * 没有，则继续往上找
 */
export function findParentTask(rootTask: CetTask, indexPath: number[]) {
  const targetTask = findTaskByIndexPath(rootTask, indexPath) as TCetTask
  if (!targetTask)
    return undefined
  const nextTask = findTaskByIndexPath(rootTask, targetTask.nextTaskPath)
  if (nextTask)
    return nextTask
  return findParentTask(rootTask, targetTask.indexPath.slice(0, -1))
}
