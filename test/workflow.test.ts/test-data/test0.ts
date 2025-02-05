/*
 * @Author: Lu
 * @Date: 2025-02-05 15:38:22
 * @LastEditTime: 2025-02-05 17:32:58
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorResultItem, CetWorkFlowConfigure } from 'package/types'
import { omit } from 'lodash-es'
import { tabId1, tabUrl1 } from './common'

export const testData0: CetWorkFlowConfigure[] = [
  {
    name: 'test',
    spBeforeFn: async () => {
      return { next: true, data: 1 }
    },
    csFn: async () => {
      return { next: true, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
    },
    spAfterFn: async () => {
      return { next: true, data: 3 }
    },
  },
]

export const testData0Result: CetActuatorResultItem = {
  name: 'test',
  success: true,
  spBeforeFn: {
    next: true,
    data: 1,
  },
  csFn: {
    next: true,
    data: 2,
    tabId: tabId1,
    tabUrl: tabUrl1,
  },
  spAfterFn: {
    next: true,
    data: 3,
  },
}

export const testData01: CetWorkFlowConfigure[] = [
  {
    name: 'test',
    spBeforeFn: async (params) => {
      return { next: true, data: { spBeforeParams: params } }
    },
    csFn: async (params) => {
      return { next: true, data: {
        result: 'test',
        csFnParams: params,
      }, tabId: tabId1, tabUrl: tabUrl1 }
    },
    spAfterFn: async (params) => {
      return { next: true, data: { spAfterParams: params, result: 'ok' } }
    },
  },
]

const spBeforeParams = {
  isFirstLevel: true,
}
const csFnParams = { isFirstLevel: true, spBeforeFnResult: {
  next: true,
  data: { spBeforeParams },
} }

export const testData01Result: CetActuatorResultItem = {
  name: 'test',
  success: true,
  spBeforeFn: {
    next: true,
    data: {
      spBeforeParams,
    },
  },
  csFn: {
    next: true,
    data: {
      result: 'test',
      csFnParams,
    },
    tabId: tabId1,
    tabUrl: tabUrl1,
  },
  spAfterFn: {
    next: true,
    data: {
      result: 'ok',
      spAfterParams: {
        isFirstLevel: true,
        csFnResult: {
          next: true,
          data: {
            result: 'test',
            csFnParams,
          },
          tabId: tabId1,
          tabUrl: tabUrl1,
        },
      },
    },
  },
}

export const testData02: CetWorkFlowConfigure[] = [
  ...testData0,
  ...testData01,
]
export const testData02Result: CetActuatorResultItem[] = [
  testData0Result,
  testData01Result,
]

export function getTestData03(): CetWorkFlowConfigure[] {
  let retryNum = 0
  let retryNum2 = 0
  return [
    { ...testData0[0], name: 't0' },
    { ...testData0[0], name: 't1', retryNumber: 1, retryTarget: 't1', spBeforeFn: async () => {
      retryNum += 1
      return { next: retryNum >= 2, data: 1 }
    } },
    { ...testData0[0], name: 't2', retryNumber: 2, retryTarget: 't1', spAfterFn: async () => {
      retryNum2 += 1
      return { next: retryNum2 === 3, data: 3 }
    } },
  ]
}
export const testData03Result: CetActuatorResultItem[] = [
  { ...testData0Result, name: 't0' },
  { ...testData0Result, name: 't1' },
  { ...testData0Result, name: 't1' },
  { ...testData0Result, name: 't1' },
  { ...testData0Result, name: 't2' },
]

export function getTestData04(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], csRetryNumber: 2, csRetryInterval: 10, spBeforeFn: async () => {
      return { next: true, data: 1 }
    }, csFn: async () => {
      retryNum += 1
      return { next: retryNum === 3, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
    } },
  ]
}
export const testData04Result: CetActuatorResultItem[] = [
  testData0Result,
]

export function getTestData05(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], csRetryNumber: 2, csRetryInterval: 10, csFn: async () => {
      retryNum += 1
      return { next: false, data: retryNum }
    } },
  ]
}
export const testData05Result: CetActuatorResultItem[] = [
  {
    ...omit(testData0Result, ['spAfterFn']),
    success: false,
    csFn: {
      next: false,
      data: 3,
    },
  },
]

export function getTestData06(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], name: 't1', retryNumber: 2, retryTarget: 't1', spBeforeFn: async () => {
      retryNum += 1
      return { next: false, data: retryNum }
    } },
  ]
}
export const testData06Result: CetActuatorResultItem[] = [
  {
    ...omit(testData0Result, ['csFn', 'spAfterFn']),
    success: false,
    name: 't1',
    spBeforeFn: {
      next: false,
      data: 3,
    },
  },
]

export function getTestData07(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], csRetryNumber: 2, csRetryInterval: 10, skipCsCallbackFail: true, csFn: async () => {
      retryNum += 1
      return { next: false, data: retryNum }
    } },
  ]
}
export const testData07Result: CetActuatorResultItem[] = [
  {
    ...testData0Result,
    success: true,
    csFn: {
      next: false,
      data: 3,
    },
  },
]
