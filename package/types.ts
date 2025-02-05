/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:44
 * @LastEditTime: 2025-02-05 17:31:50
 * @LastEditors: Lu
 * @Description:
 */
export interface LoopDataItem {
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
  currentLoopData?: LoopDataItem
  currentLoopIndex?: number
  retryNumber?: number
  skipCsCallbackError?: boolean
}

export interface CsFnParams extends CetCommonParams {
  spBeforeFnResult?: SpFnResult<any>
}
export interface CsFnResult<T = any> {
  next: boolean
  data?: T
  retryTarget?: string
  tabId?: number
  tabUrl?: string
}
export interface SpBeforeFnParams extends CetCommonParams {}
export interface SpAfterFnParams extends CetCommonParams {
  csFnResult: CsFnResult<any>
}
export interface SpFnResult<T = any> {
  next: boolean
  data?: T
  retryTarget?: string
}

export interface SpBeforeFn {
  (params: SpBeforeFnParams): Promise<SpFnResult<any>>
}
export interface SpAfterFn {
  (params: SpAfterFnParams): Promise<SpFnResult<any>>
}
export interface CsFn {
  (params: CsFnParams): Promise<CsFnResult<any>>
}

export interface CetWorkFlowConfigure {
  name: string
  children?: CetWorkFlowConfigure[]
  loopData?: LoopDataItem[]
  csRetryNumber?: number
  csRetryInterval?: number
  retryNumber?: number
  retryTarget?: string
  skipCsCallbackFail?: boolean
  csFn?: CsFn
  spBeforeFn?: SpBeforeFn
  spAfterFn?: SpAfterFn
  spBeforeEachFn?: SpBeforeFn
  spAfterEachFn?: SpAfterFn
}

export interface CetNextTimeFn {
  (): number
}

export interface CetActuatorResultItem {
  name: string
  spBeforeFn?: SpFnResult<any>
  csFn?: CsFnResult<any>
  spAfterFn?: SpFnResult<any>
  success: boolean
}

export interface CetActuatorParams {
  nextTime?: number | CetNextTimeFn
  callback?: (result: CetActuatorResultItem[]) => void
}
