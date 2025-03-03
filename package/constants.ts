/*
 * @Author: Lu
 * @Date: 2025-01-24 10:25:21
 * @LastEditTime: 2025-03-03 17:03:37
 * @LastEditors: Lu
 * @Description:
 */

export const EVENTS = {
  SP2CS_EXECUTE_TASK: 'CET_SP2CS_EXECUTE_TASK' as const,
  SP2BG_GET_CURRENT_TAB: 'CET_SP2BG_GET_CURRENT_TAB' as const,
  CS2BG_GET_CURRENT_TAB: 'CET_CS2BG_GET_CURRENT_TAB' as const,
}

export const configures = {
  debug: false,
}

export function toggleDebug(start: boolean) {
  configures.debug = start
}
