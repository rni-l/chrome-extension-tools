/*
 * @Author: Lu
 * @Date: 2025-02-12 17:53:49
 * @LastEditTime: 2025-03-10 23:01:47
 * @LastEditors: Lu
 * @Description: 
 */
import { sendMsgBySP } from "../../package/message";
import { CetDestination, CetLogLevel, CetWorkFlowConfigure } from "../../package/types";
import { asyncSetTimeout } from '../../package/utils';
import { EVENTS } from '../../package/constants';
import { CetLogger } from "../../package/components/logger";

export const cetTest1Logger = new CetLogger({
  level: CetLogLevel.DEBUG,
  isShowInConsole: true,
})

export const task1Configure: CetWorkFlowConfigure[] = [
  {
    name: 't1',
    spBeforeFn: async () => {
      await sendMsgBySP<number>(EVENTS.SP2BG_INJECT_INTERCEPT_REQUEST, undefined, { destination: CetDestination.BG })
      return {
        next: true,
      }
    },
    csFn: async () => {
      window.location.href = 'https://www.baidu.com'
      return {
        next: true,
      }
    },
  },
  {
    name: 't2',
    csRetryNumber: 5,
    csFn: async () => {
      await asyncSetTimeout(3000)
      const url = window.location.href
      return {
        next: url.includes('https://www.baidu.com')
      }
    },
  },
]