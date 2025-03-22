/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:44
 * @LastEditTime: 2025-03-22 17:54:23
 * @LastEditors: Lu
 * @Description:
 */
import type { TCetTask } from './workflow/tasks'
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
  tabId?: number
  userOption?: Record<string, any>
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
}
export interface CetCsFnResultInTask<T = unknown> extends CetCsFnResult<T> {
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
  (params: CsFnParams): Promise<CetCsFnResult<T> | undefined>
}
// // 在 content script 执行的 csFn 返回值
// export interface CetCsFnInCs<T = unknown> {
//   (params: CsFnParams): Promise<CetCsFnResultInTask<T>>
// }

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
export interface CetActuatorResult {
  logs: CetActuatorResultLogItem[]
  success: boolean
}
export interface CetActuatorResultLogItem {
  name: string
  spBeforeFn?: CetSpFnResult<any>
  csFn?: CetCsFnResult<any>
  spAfterFn?: CetSpFnResult<any>
  success: boolean
}

export interface CetActuatorParams {
  nextTime?: number | CetNextTimeFn
  callback?: (result: CetActuatorResultLogItem[]) => void
  getTabId?: (targetTask: TCetTask, currentCache: CetActuatorCache, options: CetTaskRunOptions) => Promise<number>
  taskBeforeCb?: (task: TCetTask, cache: CetActuatorCache, options: CetTaskRunOptions) => void
  taskAfterCb?: (task: TCetTask, result: boolean, logItem: CetActuatorResultLogItem | undefined) => void
}

export interface CetActuatorRunOptions {
  skipLoopFail?: boolean
}

export interface CetTaskRunOptions {
  logItem: CetActuatorResultLogItem | undefined
  currentLoopData?: CetLoopDataItem
  currentLoopIndex?: number
  userOption?: Record<string, any>
}

/*  message */
export enum CetDestination {
  CS = 'cs',
  SP = 'sp',
  BG = 'bg',
}
export interface CetDestinationOption {
  tabId?: number
  tabUrl?: string
  destination: CetDestination
}

/**
 * sendMsgByX 的参数类型
 */
export interface CetMessageCallbackParams {
  option: CetDestinationOption
  messageId: string
}
/**
 * sendMsgByX 的返回结果类型
 */
export interface CetMessageSendResult<T = unknown> {
  data: T | undefined
  success: boolean
  tabId?: number
  tabUrl?: string
  messageId: string
  msg?: string
}
/**
 * chrome.runtime.sendMessage 的 response 类型
 */
export interface CetMessageCallbackResult<R = unknown> {
  data: R | undefined
  success: boolean
  msg?: string
}
export type CetMessageCallback<T = unknown, R = unknown> = (data: T, params: CetMessageCallbackParams) => Promise<R>
export type CetMessageCsCallback<T = unknown, R = unknown> = (data: T, params: CetMessageCallbackParams) => Promise<R>
export interface CetMessageEventItem {
  messageId: string
  spCallback?: CetMessageCallback
  csCallback?: CetMessageCsCallback
  bgCallback?: CetMessageCallback
}
export interface CetMessageItem<T = unknown> {
  messageId: string
  data?: T
  option: CetDestinationOption
  success: boolean
}
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

/**
 * logger 的参数类型
 */

export enum CetLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
export type CetLogChange = (logs: CetLogEntry[]) => void
export interface CetLogOptions {
  level?: CetLogLevel
  timestamp?: boolean
  prefix?: string
  color?: boolean
  maxCacheSize?: number // 最大缓存数量
  isSyncToBG?: boolean
  isSyncToSP?: boolean
  isCS?: boolean
  isSP?: boolean
  isShowInConsole?: boolean
  logChange?: CetLogChange
  formatTimePattern?: string
}

export interface CetLogEntry {
  timestamp: string
  level: CetLogLevel
  message: string
  formattedMessage: string
  args: any[]
  isSyncToBG?: boolean
  isSyncToSP?: boolean
  isCS?: boolean
}

export interface CetEventRemoveTabParams {
  tabId: number
  pending?: number // 等待时间
}
