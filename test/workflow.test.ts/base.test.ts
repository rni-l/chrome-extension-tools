/*
 * @Author: Lu
 * @Date: 2025-01-24 11:04:12
 * @LastEditTime: 2025-03-10 22:21:38
 * @LastEditors: Lu
 * @Description: ok
 */

import type { CetCsFn, CetWorkFlowConfigure } from '../../package/types'
import { describe, expect, it, vi } from 'vitest'
import { findDeepTargetByName } from '../../package/utils'
import { CetActuator } from '../../package/workflow'
import {
  getTestData03,
  getTestData04,
  getTestData05,
  getTestData06,
  getTestData07,
  getTestData08,
  getTestData09,
  getTestData010,
  getTestData12,
  getTestData13,

  getTestData15,
  tabId1,
  tabUrl1,
  testData0,
  testData0Result,
  testData01,
  testData01Result,
  testData1,
  testData1Result,
  testData02,
  testData02Result,
  testData2,
  testData2Result,
  testData03Result,
  testData04Result,
  testData05Result,
  testData06Result,
  testData07Result,
  testData08Result,
  testData09Result,
  testData010Result,
  testData11,
  testData11Result,
  testData12Result,
  testData13Result,
  testData14,
  testData14Result,
  testData15Result,
  testData21,
  testData21Result,
} from './test-data'

let targetData: CetWorkFlowConfigure[] = []
vi.mock('../../package/message', () => {
  return {
    sendMsgBySP: vi.fn().mockImplementation(async (event, data: Parameters<CetCsFn>[0]) => {
      const target = findDeepTargetByName(targetData, data.name)
      if (!target)
        throw new Error('target not found')
      if (!target.csFn) {
        // TODO: mock get tab id
        return { next: true, tabId: tabId1, tabUrl: tabUrl1 }
      }
      const res = await target.csFn(data)
      return { success: true, data: { data: res.data, tabId: tabId1, tabUrl: tabUrl1, next: res.next } }
    }),
  }
})

describe('工作流：Actuator', () => {
  describe('前置校验', () => {
    it('name 不能有重复', async () => {
      const ins = new CetActuator([
        testData0[0],
        testData0[0],
      ])
      const p = () => ins.run()
      await expect(p).rejects.toThrowError('name 不能重复')
    })
    it('两层级，name 不能有重复', async () => {
      const ins = new CetActuator([
        {
          ...testData0[0],
          children: [
            testData0[0],
          ],
        },
      ])
      const p = () => ins.run()
      await expect(p).rejects.toThrowError('name 不能重复')
    })
    it('多层级，name 不能有重复', async () => {
      const ins = new CetActuator([
        {
          ...testData0[0],
          children: [
            {
              ...testData0[0],
              name: '2',
              children: [
                testData0[0],
              ],
            },
          ],
        },
      ])
      const p = () => ins.run()
      await expect(p).rejects.toThrowError('name 不能重复')
    })
  })

  describe('一层级', () => {
    it('先执行 spBeforeFn，再执行 csFn，再执行 spAfterFn。', async () => {
      targetData = testData0
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject([testData0Result])
      expect(success).toBe(true)
    })
    it('spBeforeFn 返回失败，csFn 不返回结果，spAfterFn 不返回结果', async () => {
      targetData = [{
        name: 'test',
        spBeforeFn: async () => {
          return { next: false, data: 1 }
        },
        csFn: async () => {
          return { next: true, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
        },
        spAfterFn: async () => {
          return { next: true, data: 3 }
        },
      }]
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject([{ name: 'test', success: false, spBeforeFn: {
        next: false,
        data: 1,
      } }])
      expect(success).toBe(false)
    })
    it('csFn 返回失败，spAfterFn 不返回结果', async () => {
      targetData = [{
        name: 'test',
        spBeforeFn: async () => {
          return { next: true, data: 1 }
        },
        csFn: async () => {
          return { next: false, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
        },
        spAfterFn: async () => {
          return { next: true, data: 3 }
        },
      }]
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject([{ name: 'test', success: false, spBeforeFn: {
        next: true,
        data: 1,
      }, csFn: {
        next: false,
        data: 2,
        tabId: tabId1,
        tabUrl: tabUrl1,
      } }])
      expect(success).toBe(false)
    })
    it('spAfterFn 返回失败，结果 success 为 false', async () => {
      targetData = [{
        name: 'test',
        spBeforeFn: async () => {
          return { next: true, data: 1 }
        },
        csFn: async () => {
          return { next: true, data: 2, tabId: tabId1, tabUrl: tabUrl1 }
        },
        spAfterFn: async () => {
          return { next: false, data: 3 }
        },
      }]
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject([{ name: 'test', success: false, spBeforeFn: {
        next: true,
        data: 1,
      }, csFn: {
        next: true,
        data: 2,
        tabId: tabId1,
        tabUrl: tabUrl1,
      }, spAfterFn: {
        next: false,
        data: 3,
      } }])
      expect(success).toBe(false)
    })
    it('每个 fn 成功执行完后，会把结果传递给下一个 fn。', async () => {
      targetData = testData01
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject([testData01Result])
      expect(success).toBe(true)
    })
    it('第一个任务执行完并返回 true，则会执行第二个任务', async () => {
      targetData = testData02
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData02Result)
      expect(success).toBe(true)
    })
    it('配置 retryNumber 和 retryTarget，当该任务失败时（success: false），会跳转到指定节点并执行指定次数', async () => {
      targetData = getTestData03()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData03Result)
      expect(success).toBe(true)
    })
    it('配置 retryNumber 和 retryTarget，当该任务失败时（success: false），重试指定次数后还是返回失败，结束任务', async () => {
      targetData = getTestData06()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData06Result)
      expect(success).toBe(false)
    })
    it('配置 csRetryNumber，当任务的 csFn 返回 next: false 时，会重试指定次数，直到返回成功或超过次数', async () => {
      targetData = getTestData04()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData04Result)
      expect(success).toBe(true)
    })
    it('配置 csRetryNumber，当任务的 csFn 返回 next: false，重试指定次数后还是返回失败，结束任务', async () => {
      targetData = getTestData05()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData05Result)
      expect(success).toBe(false)
    })
    it('配置 skipCsCallbackFail，如果 csFn 返回 false，也可以继续下一个步骤', async () => {
      targetData = getTestData07()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData07Result)
      expect(success).toBe(true)
    })
    it('spBefore, csFn, spAfter 会接收到当前的 retryNumber', async () => {
      targetData = getTestData08()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData08Result)
      expect(success).toBe(true)
    })
    it('csFn 会接收到当前的 csRetryNumber', async () => {
      targetData = getTestData09()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData09Result)
      expect(success).toBe(true)
    })
    it('支持传入自定义参数', async () => {
      targetData = getTestData010()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run({}, { name: 'test' })
      expect(logs).toMatchObject(testData010Result)
      expect(success).toBe(true)
    })
  })

  describe('多层级', () => {
    it('先执行当前任务的子任务，成功并执行完后，再执行当前任务的下一个任务', async () => {
      targetData = testData1
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData1Result)
      expect(success).toBe(true)
    })
    it('子任务返回失败，则整个任务结束', async () => {
      targetData = testData11
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData11Result)
      expect(success).toBe(false)
    })
    it('设置 skipLoopFail，子任务返回失败，则该轮循环结束，进行下一轮循环', async () => {
      targetData = getTestData15()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run({ skipLoopFail: true })
      expect(logs).toMatchObject(testData15Result)
      expect(success).toBe(true)
    })
    it('子任务也支持 retryNumber', async () => {
      targetData = getTestData12()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData12Result)
      expect(success).toBe(true)
    })
    it('子任务也支持 csRetryNumber', async () => {
      targetData = getTestData13()
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run({ skipLoopFail: true })
      expect(logs).toMatchObject(testData13Result)
      expect(success).toBe(true)
    })
    it('支持多层级', async () => {
      targetData = testData14
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData14Result)
      expect(success).toBe(true)
    })
    // it("retryTarget 指向父级")
  })

  describe('多层级 + 循环', () => {
    it('二级后的子任务，支持循环，可以在参数中获取到一些循环的参数', async () => {
      targetData = testData2
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData2Result)
      expect(success).toBe(true)
    })
    it('三级嵌套循环', async () => {
      targetData = testData21
      const ins = new CetActuator(targetData)
      const { logs, success } = await ins.run()
      expect(logs).toMatchObject(testData21Result)
      expect(success).toBe(true)
    })
  })
})
