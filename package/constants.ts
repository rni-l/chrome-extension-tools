/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:21
 * @LastEditTime: 2025-03-10 22:54:14
 * @LastEditors: Lu
 * @Description:
 */

export const EVENTS = {
  SP2CS_EXECUTE_TASK: 'CET_SP2CS_EXECUTE_TASK' as const,
  SP2BG_GET_CURRENT_TAB: 'CET_SP2BG_GET_CURRENT_TAB' as const,
  CS2BG_GET_CURRENT_TAB: 'CET_CS2BG_GET_CURRENT_TAB' as const,
  GET_CONTENT_SCRIPT_REQUEST: 'CET_GET_CONTENT_SCRIPT_REQUEST' as const,
  CS2SP_GET_REQUEST: 'CS2SP_GET_REQUEST' as const,
  CS2BG_GET_REQUEST: 'CS2BG_GET_REQUEST' as const,
  CS2SP_LOG: 'CS2SP_LOG' as const,
  CS2BG_LOG: 'CS2BG_LOG' as const,
  SP2BG_LOG: 'SP2BG_LOG' as const,
  SP2BG_INJECT_INTERCEPT_REQUEST: 'SP2BG_INJECT_INTERCEPT_REQUEST' as const,
}

export const configures = {
  debug: false,
}

export function toggleDebug(start: boolean) {
  configures.debug = start
}
