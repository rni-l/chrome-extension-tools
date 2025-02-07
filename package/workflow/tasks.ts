/*
 * @Author: Lu
 * @Date: 2025-02-07 17:44:15
 * @LastEditTime: 2025-02-07 23:52:09
 * @LastEditors: Lu
 * @Description:
 */

import type { CetActuatorCache, CetCommonParams, CetCsFnResult, CetSpFnResult, CetTaskRunOptions, CetWorkFlowConfigure } from 'package/types'
import { loopCheck } from 'package/utils'

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

export class CetTask {
  configure: CetWorkFlowConfigure
  name = ''
  children: CetTask[] = []
  indexPath: number[] = []
  level = 0
  nextTaskPath: number[] = []
  hasChildren = false
  isRoot = false

  constructor(configure: CetWorkFlowConfigure, path: number[], isRoot?: boolean) {
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
    this.isRoot = !!isRoot
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
    const commonParams: CetCommonParams = { isFirstLevel: true }
    if (currentCache.isRetry && currentCache.currentRetryNumber > 0) {
      commonParams.retryNumber = currentCache.currentRetryNumber
    }
    const spBeforeResult: CetSpFnResult = configure.spBeforeFn
      ? await configure.spBeforeFn(commonParams)
      : getCommonSpResult()
    options.logItem.spBeforeFn = spBeforeResult
    if (!spBeforeResult || !spBeforeResult.next) {
      return false
    }
    let csResult: CetCsFnResult = getCommonCsResult()
    if (configure.csFn) {
      await loopCheck(async (number) => {
        csResult = await configure.csFn!({
          ...commonParams,
          spBeforeFnResult: spBeforeResult,
          csRetryNumber: number,
        })
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

export function getTaskTrees(configures: CetWorkFlowConfigure[], parentPath: number[] = [], nameMap: Record<string, number[]>) {
  const trees: CetTask[] = configures.map((configure, i) => {
    const tree = new CetTask(configure, [i])
    nameMap[configure.name] = tree.indexPath
    if (configure.children)
      tree.children = getTaskTrees(configure.children, [...parentPath, i].filter(v => v >= 0), nameMap)
    return tree
  })
  return trees
}

export function getTaskTree(configures: CetWorkFlowConfigure[]) {
  const nameMap: Record<string, number[]> = {}
  const rootTask = new CetTask({ name: 'root', children: [] }, [], true)
  rootTask.appendChildren(getTaskTrees(configures, [], nameMap))
  return { rootTask, nameMap }
}

export type TCetTask = InstanceType<typeof CetTask>

export function findTaskByIndexPath(task: TCetTask, indexPath: number[]) {
  try {
    let t: TCetTask | undefined = task
    for (let index = 0; index < indexPath.length; index++) {
      t = task.children[indexPath[index]]
    }
    return t
  }
  catch (e) {
    console.log(e)
    return undefined
  }
}
