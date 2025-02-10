/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:44
 * @LastEditTime: 2025-02-08 23:09:31
 * @LastEditors: Lu
 * @Description:
 */
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
}

export interface CsFnParams extends CetCommonParams {
  spBeforeFnResult?: CetSpFnResult<any>
  csRetryNumber?: number
}
export interface CetCsFnResult<T = any> {
  next: boolean
  data?: T
  retryTarget?: string
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

export interface CetSpBeforeFn {
  (params: CetSpBeforeFnParams): Promise<CetSpFnResult<any>>
}
export interface CetSpAfterFn {
  (params: CetSpAfterFnParams): Promise<CetSpFnResult<any>>
}
export interface CetCsFn {
  (params: CsFnParams): Promise<CetCsFnResult<any>>
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
