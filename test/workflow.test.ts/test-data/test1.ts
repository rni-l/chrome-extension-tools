/*
 * @Author: Lu
 * @Date: 2025-01-24 11:06:05
 * @LastEditTime: 2025-02-07 17:13:00
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorResultItem, CetWorkFlowConfigure } from 'package/types'
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

export const testData1Result: CetActuatorResultItem[] = [
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

export const testData11Result: CetActuatorResultItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  {
    ...testData0Result,
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
        retryTarget: 't1',
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

export const testData12Result: CetActuatorResultItem[] = [
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
        return { next: retryNum === 3, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
      } },
      {
        ...testData0[0],
        name: 'test02',
      },
    ] },
    { ...testData0[0], name: 'test1' },
  ]
}

export const testData13Result: CetActuatorResultItem[] = [
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

export const testData14Result: CetActuatorResultItem[] = [
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
