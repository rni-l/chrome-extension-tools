/*
 * @Author: Lu
 * @Date: 2025-02-06 23:47:09
 * @LastEditTime: 2025-02-10 23:12:43
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorResultItem, CetLoopDataItem, CetWorkFlowConfigure } from 'package/types'
import { tabId1, tabUrl1 } from './common'
import { testData0, testData0Result } from './test0'

export const testData2: CetWorkFlowConfigure[] = [
  {
    ...testData0[0],
    name: 'test0',
    loopData: [
      { name: '1', value: 1 },
      { name: '2', value: 2 },
      { name: '3', value: 3 },
    ],
    children: [
      {
        ...testData0[0],
        name: 'test01',
        spBeforeFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
        csFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex }, tabId: tabId1, tabUrl: tabUrl1 }),
        spAfterFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
      },
      {
        ...testData0[0],
        name: 'test02',
        spBeforeFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
        csFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex }, tabId: tabId1, tabUrl: tabUrl1 }),
        spAfterFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
      },
    ],
  },
  { ...testData0[0], name: 'test1' },
]
function getTestData2ItemResult(name: string, currentLoopData: CetLoopDataItem, currentLoopIndex: number): CetActuatorResultItem {
  return {
    name,
    success: true,
    spBeforeFn: {
      next: true,
      data: {
        currentLoopData,
        currentLoopIndex,
      },
    },
    csFn: {
      next: true,
      data: {
        currentLoopData,
        currentLoopIndex,
      },
      tabId: tabId1,
      tabUrl: tabUrl1,
    },
    spAfterFn: {
      next: true,
      data: {
        currentLoopData,
        currentLoopIndex,
      },
    },
  }
}

export const testData2Result: CetActuatorResultItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  { ...getTestData2ItemResult('test01', { name: '1', value: 1 }, 0) },
  { ...getTestData2ItemResult('test02', { name: '1', value: 1 }, 0) },
  { ...getTestData2ItemResult('test01', { name: '2', value: 2 }, 1) },
  { ...getTestData2ItemResult('test02', { name: '2', value: 2 }, 1) },
  { ...getTestData2ItemResult('test01', { name: '3', value: 3 }, 2) },
  { ...getTestData2ItemResult('test02', { name: '3', value: 3 }, 2) },
  {
    ...testData0Result,
    name: 'test1',
  },
]
export const testData21: CetWorkFlowConfigure[] = [
  {
    ...testData0[0],
    name: 'test0',
    loopData: [
      { name: '1', value: 1 },
      { name: '2', value: 2 },
    ],
    children: [
      {
        ...testData0[0],
        name: 'test01',
        spBeforeFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
        csFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex }, tabId: tabId1, tabUrl: tabUrl1 }),
        spAfterFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
        loopData: [
          { name: '11', value: 11 },
          { name: '22', value: 22 },
        ],
        children: [
          {
            ...testData0[0],
            name: 'test011',
            spBeforeFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
            csFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex }, tabId: tabId1, tabUrl: tabUrl1 }),
            spAfterFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
          },
          {
            ...testData0[0],
            name: 'test012',
            spBeforeFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
            csFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex }, tabId: tabId1, tabUrl: tabUrl1 }),
            spAfterFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
          },
        ],
      },
      {
        ...testData0[0],
        name: 'test02',
        spBeforeFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
        csFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex }, tabId: tabId1, tabUrl: tabUrl1 }),
        spAfterFn: async p => ({ next: true, data: { currentLoopData: p.currentLoopData, currentLoopIndex: p.currentLoopIndex } }),
      },
    ],
  },
  { ...testData0[0], name: 'test1' },
]

export const testData21Result: CetActuatorResultItem[] = [
  {
    ...testData0Result,
    name: 'test0',
  },
  { ...getTestData2ItemResult('test01', { name: '1', value: 1 }, 0) },
  { ...getTestData2ItemResult('test011', { name: '11', value: 11 }, 0) },
  { ...getTestData2ItemResult('test012', { name: '11', value: 11 }, 0) },
  { ...getTestData2ItemResult('test011', { name: '22', value: 22 }, 1) },
  { ...getTestData2ItemResult('test012', { name: '22', value: 22 }, 1) },
  { ...getTestData2ItemResult('test02', { name: '1', value: 1 }, 0) },
  { ...getTestData2ItemResult('test01', { name: '2', value: 2 }, 1) },
  { ...getTestData2ItemResult('test011', { name: '11', value: 11 }, 0) },
  { ...getTestData2ItemResult('test012', { name: '11', value: 11 }, 0) },
  { ...getTestData2ItemResult('test011', { name: '22', value: 22 }, 1) },
  { ...getTestData2ItemResult('test012', { name: '22', value: 22 }, 1) },
  { ...getTestData2ItemResult('test02', { name: '2', value: 2 }, 1) },
  {
    ...testData0Result,
    name: 'test1',
  },
]
