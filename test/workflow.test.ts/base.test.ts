/*
 * @Author: Lu
 * @Date: 2025-01-24 11:04:12
 * @LastEditTime: 2025-02-05 23:15:01
 * @LastEditors: Lu
 * @Description:
 */
import { Actuator } from 'package/workflow'
import { describe, expect, it } from 'vitest'
import {
  getTestData03,
  getTestData04,
  getTestData05,
  getTestData06,
  getTestData07,
  tabId1,
  tabUrl1,
  testData0,
  testData0Result,
  testData01,
  testData01Result,
  testData02,
  testData02Result,
  testData03Result,
  testData04Result,
  testData05Result,
  testData06Result,
  testData07Result,
} from './test-data'

/**
 * 需要模拟浏览器插件的执行方式，csFn 和 spFn 的上下文不一样，内存不是共用的
 */
describe('工作流：Actuator', () => {
  describe('前置校验', () => {
    it('name 不能有重复', async () => {
      const ins = new Actuator([
        testData0[0],
        testData0[0],
      ])
      expect(() => ins.run()).rejects.toThrowError('name 不能重复')
    })
  })

  describe('一层级', () => {
    it('先执行 spBeforeFn，再执行 csFn，再执行 spAfterFn。', async () => {
      const ins = new Actuator(testData0)
      const logs = await ins.run()
      expect(logs).toMatchObject([testData0Result])
    })
    it('spBeforeFn 返回失败，csFn 不返回结果，spAfterFn 不返回结果', async () => {
      const ins = new Actuator([{
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
      }])
      const logs = await ins.run()
      expect(logs).toMatchObject([{ name: 'test', success: false, spBeforeFn: {
        next: false,
        data: 1,
      } }])
    })
    it('csFn 返回失败，spAfterFn 不返回结果', async () => {
      const ins = new Actuator([{
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
      }])
      const logs = await ins.run()
      expect(logs).toMatchObject([{ name: 'test', success: false, spBeforeFn: {
        next: true,
        data: 1,
      }, csFn: {
        next: false,
        data: 2,
        tabId: tabId1,
        tabUrl: tabUrl1,
      } }])
    })
    it('spAfterFn 返回失败，结果 success 为 false', async () => {
      const ins = new Actuator([{
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
      }])
      const logs = await ins.run()
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
    })
    it('每个 fn 成功执行完后，会把结果传递给下一个 fn。', async () => {
      const ins = new Actuator(testData01)
      const logs = await ins.run()
      expect(logs).toMatchObject([testData01Result])
    })
    it('第一个任务执行完并返回 true，则会执行第二个任务', async () => {
      const ins = new Actuator(testData02)
      const logs = await ins.run()
      expect(logs).toMatchObject(testData02Result)
    })
    it('配置 retryNumber 和 retryTarget，当该任务失败时（success: false），会跳转到指定节点并执行指定次数', async () => {
      const ins = new Actuator(getTestData03())
      const logs = await ins.run()
      expect(logs).toMatchObject(testData03Result)
    })
    it('配置 retryNumber 和 retryTarget，当该任务失败时（success: false），重试指定次数后还是返回失败，结束任务', async () => {
      const ins = new Actuator(getTestData06())
      const logs = await ins.run()
      expect(logs).toMatchObject(testData06Result)
    })
    it('配置 csRetryNumber，当任务的 csFn 返回 next: false 时，会重试指定次数，直到返回成功或超过次数', async () => {
      const ins = new Actuator(getTestData04())
      const logs = await ins.run()
      expect(logs).toMatchObject(testData04Result)
    })
    it('配置 csRetryNumber，当任务的 csFn 返回 next: false，重试指定次数后还是返回失败，结束任务', async () => {
      const ins = new Actuator(getTestData05())
      const logs = await ins.run()
      expect(logs).toMatchObject(testData05Result)
    })
    it('配置 skipCsCallbackFail，如果 csFn 返回 false，也可以继续下一个步骤', async () => {
      const ins = new Actuator(getTestData07())
      const logs = await ins.run()
      expect(logs).toMatchObject(testData07Result)
    })
  })
})
