/*
 * @Author: Lu
 * @Date: 2025-01-24 11:06:05
 * @LastEditTime: 2025-03-20 00:29:09
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorResultLogItem, CetWorkFlowConfigure } from 'package/types'
import { omit } from 'lodash-es'
import { tabId1, tabUrl1 } from './common'
import { testData0, testData0Result } from './test0'

export const testData1: CetWorkFlowConfigure[] = [
  { ...testData0[0], name: 'test0', children: [
    {
      ...testData0[0],
      name: 'test01',
    },
    {
      ...testData0[0],
      name: 'test02',
    },
  ] },
  { ...testData0[0], name: 'test1' },
]

export const testData1Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...testData0Result,
    name: 'test01',
  },
  {
    ...testData0Result,
    name: 'test02',
  },
  {
    ...testData0Result,
    name: 'test1',
  },
]
export const testData11: CetWorkFlowConfigure[] = [
  { ...testData0[0], name: 'test0', children: [
    {
      ...testData0[0],
      name: 'test01',
      spBeforeFn: async () => ({ next: false }),
    },
    {
      ...testData0[0],
      name: 'test02',
    },
  ] },
  { ...testData0[0], name: 'test1' },
]

export const testData11Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...omit(testData0Result, ['csFn', 'spAfterFn']),
    name: 'test01',
    spBeforeFn: { next: false },
    success: false,
  },
]

export function getTestData12(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], name: 'test0', children: [
      {
        ...testData0[0],
        name: 'test01',
        retryNumber: 1,
        retryTarget: 'test01',
        spBeforeFn: async () => {
          retryNum += 1
          return { next: retryNum >= 2, data: 1 }
        },
      },
      {
        ...testData0[0],
        name: 'test02',
      },
    ] },
    { ...testData0[0], name: 'test1' },
  ]
}

export const testData12Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...testData0Result,
    name: 'test01',
  },
  {
    ...testData0Result,
    name: 'test02',
  },
  {
    ...testData0Result,
    name: 'test1',
  },
]
export function getTestData13(): CetWorkFlowConfigure[] {
  let retryNum = 0
  return [
    { ...testData0[0], name: 'test0', children: [
      { ...testData0[0], csRetryNumber: 2, csRetryInterval: 10, spBeforeFn: async () => {
        return { next: true, data: 1 }
      }, csFn: async () => {
        retryNum += 1
        const next = retryNum === 3
        if (!next)
          return
        return { next, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
      }, name: 'test01' },
      {
        ...testData0[0],
        name: 'test02',
      },
    ] },
    { ...testData0[0], name: 'test1' },
  ]
}

export const testData13Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...testData0Result,
    name: 'test01',
  },
  {
    ...testData0Result,
    name: 'test02',
  },
  {
    ...testData0Result,
    name: 'test1',
  },
]

export const testData14: CetWorkFlowConfigure[] = [
  { ...testData0[0], name: 'test0', children: [
    {
      ...testData0[0],
      name: 'test01',
      children: [
        {
          ...testData0[0],
          name: 'test011',
        },
      ],
    },
    {
      ...testData0[0],
      name: 'test02',
      children: [
        {
          ...testData0[0],
          name: 'test021',
        },
        {
          ...testData0[0],
          name: 'test022',
        },
      ],
    },
  ] },
  { ...testData0[0], name: 'test1' },
]

export const testData14Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...testData0Result,
    name: 'test01',
  },
  {
    ...testData0Result,
    name: 'test011',
  },
  {
    ...testData0Result,
    name: 'test02',
  },
  {
    ...testData0Result,
    name: 'test021',
  },
  {
    ...testData0Result,
    name: 'test022',
  },
  {
    ...testData0Result,
    name: 'test1',
  },
]

export function getTestData15(): CetWorkFlowConfigure[] {
  let i = 0
  return [
    { ...testData0[0], name: 'test0', loopData: [
      {
        name: 'a1',
        value: 'a1',
      },
      {
        name: 'a2',
        value: 'a2',
      },
    ], children: [
      {
        ...testData0[0],
        name: 'test01',
        spBeforeFn: async () => {
          if (i === 0) {
            i += 1
            return { next: false }
          }
          return { next: true, data: 1 }
        },
      },
      {
        ...testData0[0],
        name: 'test02',
      },
      {
        ...testData0[0],
        name: 'test03',
        spBeforeFn: async () => ({ next: true }),
      },
      {
        ...testData0[0],
        name: 'test04',
      },
    ] },
    { ...testData0[0], name: 'test1' },
  ]
}

export const testData15Result: CetActuatorResultLogItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...omit(testData0Result, ['csFn', 'spAfterFn']),
    name: 'test01',
    spBeforeFn: { next: false },
    success: false,
  },
  {
    ...testData0Result,
    name: 'test01',
  },
  {
    ...testData0Result,
    name: 'test02',
  },
  {
    ...testData0Result,
    name: 'test03',
    spBeforeFn: { next: true },
    success: true,
  },
  {
    ...testData0Result,
    name: 'test04',
  },
  {
    ...testData0Result,
    name: 'test1',
  },
]
