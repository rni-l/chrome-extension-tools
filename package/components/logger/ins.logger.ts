/*
 * @Author: Lu
 * @Date: 2025-03-04 17:15:28
 * @LastEditTime: 2025-03-04 17:41:09
 * @LastEditors: Lu
 * @Description: 日志实例
 */

import { CetLogLevel } from '../../types'
import { CetLogger } from './index'

export const cetLogger = new CetLogger({
  isCS: true,
  isSP: true,
  isSyncToBG: true,
  isSyncToSP: true,
  level: CetLogLevel.DEBUG,
})
