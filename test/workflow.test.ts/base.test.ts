/*
 * @Author: Lu
 * @Date: 2025-01-24 11:04:12
 * @LastEditTime: 2025-01-31 17:53:30
 * @LastEditors: Lu
 * @Description:
 */
import { Actuator } from 'package/workflow'
import { describe, expect, it } from 'vitest'
import { tabId1, tabUrl1, testData1 } from './test-data'

/**
 * 需要模拟浏览器插件的执行方式，csFn 和 spFn 的上下文不一样，内存不是共用的
 */
describe('工作流：Actuator', () => {
  describe('一层级', () => {
    it('先执行 spBeforeFn，再执行 csFn，再执行 spAfterFn；每个 fn 成功执行完后，会把结果传递给下一个 fn。', async () => {
      return new Promise((resolve) => {
        const ins = new Actuator(testData1, {
          callback: (params) => {
            expect(params).toMatchObject([
              {
                name: 'test',
                success: true,
                spBeforeFn: {
                  next: true,
                  data: {
                    spBeforeParams: {
                      isFirstLevel: true,
                      currentLoopData: undefined,
                      currentLoopIndex: undefined,
                      retryNumber: 0,
                      skipCsCallbackError: false,
                    },
                  },
                },
                csFn: {
                  next: true,
                  data: {
                    result: 'test',
                    csFnParams: {
                      isFirstLevel: true,
                      currentLoopData: undefined,
                      currentLoopIndex: undefined,
                      retryNumber: 0,
                      skipCsCallbackError: false,
                      spBeforeFnResult: {
                        next: true,
                        data: {
                          spBeforeParams: {
                            isFirstLevel: true,
                            currentLoopData: undefined,
                            currentLoopIndex: undefined,
                            retryNumber: 0,
                            skipCsCallbackError: false,
                          },
                        },
                      },
                    },
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
                      currentLoopData: undefined,
                      currentLoopIndex: undefined,
                      retryNumber: 0,
                      skipCsCallbackError: false,
                      spBeforeFnResult: {
                        next: true,
                        data: {
                          spBeforeParams: {
                            isFirstLevel: true,
                            currentLoopData: undefined,
                            currentLoopIndex: undefined,
                            retryNumber: 0,
                            skipCsCallbackError: false,
                          },
                        },
                      },
                    },
                  },
                },
              },
            ])
            resolve(true)
          },
        })
        ins.run()
      })
    })
    it('spBeforeFn 返回失败，csFn 不返回结果，spAfterFn 不返回结果', async () => {
      return new Promise((resolve) => {
        const ins = new Actuator(testData1, {
          callback: (params) => {
            expect(params).toMatchObject([])
            resolve(true)
          },
        })
        ins.run()
      })
    })
  })
})
