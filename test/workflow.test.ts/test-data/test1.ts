/*
 * @Author: Lu
 * @Date: 2025-01-24 11:06:05
 * @LastEditTime: 2025-02-05 15:17:47
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorResultItem, CetWorkFlowConfigure } from 'package/types'
import { tabId1, tabUrl1 } from './common'

export const testData1: CetWorkFlowConfigure[] = [
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

export const testData1Result: CetActuatorResultItem = {
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
