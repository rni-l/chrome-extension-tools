/*
 * @Author: Lu
 * @Date: 2025-02-05 15:38:22
 * @LastEditTime: 2025-03-09 22:43:07
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorResultLogItem, CetWorkFlowConfigure } from '../../../package/types'
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

export const testData0Result: CetActuatorResultLogItem = {
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
    name: 'test1',
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

export const testData01Result: CetActuatorResultLogItem = {
  name: 'test1',
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
export const testData02Result: CetActuatorResultLogItem[] = [
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
export const testData03Result: CetActuatorResultLogItem[] = [
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
export const testData04Result: CetActuatorResultLogItem[] = [
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
export const testData05Result: CetActuatorResultLogItem[] = [
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
export const testData06Result: CetActuatorResultLogItem[] = [
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
export const testData07Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    success: true,
    csFn: {
      next: false,
      data: 3,
    },
  },
]

export function getTestData08(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    {
      ...testData0[0],
      name: 't1',
      retryNumber: 2,
      retryTarget: 't1',
      spBeforeFn: async (p) => {
        retryNum += 1
        return { next: retryNum > 1, data: { paramsRetryNumber: p.retryNumber } }
      },
      csFn: async (p) => {
        return { next: true, data: { paramsRetryNumber: p.retryNumber } }
      },
      spAfterFn: async (p) => {
        return { next: true, data: { paramsRetryNumber: p.retryNumber } }
      },
    },
  ]
}
export const testData08Result: CetActuatorResultLogItem[] = [
  {
    ...omit(testData0Result, ['csFn', 'spAfterFn']),
    success: true,
    name: 't1',
    spBeforeFn: {
      next: true,
      data: { paramsRetryNumber: 1 },
    },
    csFn: {
      next: true,
      data: { paramsRetryNumber: 1 },
    },
    spAfterFn: {
      next: true,
      data: { paramsRetryNumber: 1 },
    },
  },
]

export function getTestData09(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], csRetryNumber: 2, csRetryInterval: 10, skipCsCallbackFail: true, csFn: async (p) => {
      retryNum += 1
      return { next: retryNum === 3, data: { paramsRetryNumber: p.csRetryNumber } }
    } },
  ]
}
export const testData09Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    success: true,
    csFn: {
      next: true,
      data: { paramsRetryNumber: 2 },
    },
  },
]

export function getTestData010(): CetWorkFlowConfigure[] {
  return [
    { ...testData0[0], spBeforeFn: async (params) => {
      return { next: true, data: params.userOption?.name }
    }, spAfterFn: async (params) => {
      return { next: true, data: params.userOption?.name }
    }, csFn: async (params) => {
      return { next: true, data: params.userOption?.name }
    } },
  ]
}
export const testData010Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    success: true,
    spBeforeFn: {
      next: true,
      data: 'test',
    },
    csFn: {
      next: true,
      data: 'test',
    },
    spAfterFn: {
      next: true,
      data: 'test',
    },
  },
]
