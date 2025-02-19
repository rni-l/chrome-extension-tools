/*
 * @Author: Lu
 * @Date: 2025-02-12 17:53:49
 * @LastEditTime: 2025-02-15 00:31:06
 * @LastEditors: Lu
 * @Description: 
 */
import { CetWorkFlowConfigure } from "../../package/types";
import { asyncSetTimeout } from '../../package/utils';

export const task1Configure: CetWorkFlowConfigure[] = [
  {
    name: 't1',
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