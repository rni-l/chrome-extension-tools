/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:44
 * @LastEditTime: 2025-02-12 18:05:19
 * @LastEditors: Lu
 * @Description:
 */

/* workflow */
export interface CetLoopDataItem {
  name: string
  value: string | number | symbol
}

export interface CetActuatorCache {
  name: string
  retryNumber: number
  currentRetryNumber: number
  isRetry: boolean
}

export interface CetCommonParams {
  isFirstLevel: boolean
  currentLoopData?: CetLoopDataItem
  currentLoopIndex?: number
  retryNumber?: number
  skipCsCallbackError?: boolean
  name: string
}

export interface CsFnParams extends CetCommonParams {
  spBeforeFnResult?: CetSpFnResult<any>
  csRetryNumber?: number
  tabId: number
}
export interface CetCsFnResult<T = unknown> {
  next: boolean
  data?: T
  retryTarget?: string
  tabId?: number
  tabUrl?: string
}
export interface CetCsFnResultInCs<T = unknown> extends CetCsFnResult<T> {
  tabId?: number
  tabUrl?: string
}
export interface CetSpBeforeFnParams extends CetCommonParams {}
export interface CetSpAfterFnParams extends CetCommonParams {
  csFnResult: CetCsFnResult<any>
}
export interface CetSpFnResult<T = any> {
  next: boolean
  data?: T
  retryTarget?: string
}

export interface CetSpBeforeFn<T = unknown> {
  (params: CetSpBeforeFnParams): Promise<CetSpFnResult<T>>
}
export interface CetSpAfterFn<T = unknown> {
  (params: CetSpAfterFnParams): Promise<CetSpFnResult<T>>
}
// 用户在配置中定义的 csFn
export interface CetCsFn<T = unknown> {
  (params: CsFnParams): Promise<CetCsFnResult<T>>
}
// 在 content script 执行的 csFn 返回值
export interface CetCsFnInCs<T = unknown> {
  (params: CsFnParams): Promise<CetCsFnResultInCs<T>>
}

export interface CetWorkFlowConfigure {
  name: string
  children?: CetWorkFlowConfigure[]
  loopData?: CetLoopDataItem[]
  csRetryNumber?: number
  csRetryInterval?: number
  retryNumber?: number
  retryTarget?: string
  skipCsCallbackFail?: boolean
  csFn?: CetCsFn
  spBeforeFn?: CetSpBeforeFn
  spAfterFn?: CetSpAfterFn
  spBeforeEachFn?: CetSpBeforeFn
  spAfterEachFn?: CetSpAfterFn
}

export interface CetNextTimeFn {
  (): number
}

export interface CetActuatorResultItem {
  name: string
  spBeforeFn?: CetSpFnResult<any>
  csFn?: CetCsFnResult<any>
  spAfterFn?: CetSpFnResult<any>
  success: boolean
}

export interface CetActuatorParams {
  nextTime?: number | CetNextTimeFn
  callback?: (result: CetActuatorResultItem[]) => void
}

export interface CetTaskRunOptions {
  logItem: CetActuatorResultItem | undefined
  currentLoopData?: CetLoopDataItem
  currentLoopIndex?: number
}

/*  message */
// content script message 的参数和返回值
export interface CetCSMessageParams<T = unknown> {
  data: T
}
export interface CetCSMessageReturnData<T = unknown> {
  data: T
  tabId: number
}

// background message 的参数和返回值
export interface CetBGMessageParams<T = unknown> {
  data: T
}

export interface CetBGMessageReturnData<T = unknown> {
  data: T
}

// sp message 的参数和返回值
export interface CetSPMessageParams<T = unknown> {
  data: T
}
export interface CetSPMessageReturnData<T = unknown> {
  data: T
}
