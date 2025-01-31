/*
 * @Author: Lu
 * @Date: 2025-01-24 10:28:18
 * @LastEditTime: 2025-01-31 17:02:30
 * @LastEditors: Lu
 * @Description:
 */
import type { CetActuatorParams, CetWorkFlowConfigure } from 'package/types'

const C_NEXT_TIME = 1000 * 1 * 60

export class Actuator {
  configure: CetWorkFlowConfigure[]
  params: CetActuatorParams
  constructor(conConfigure: CetWorkFlowConfigure[], conParams?: CetActuatorParams) {
    this.configure = conConfigure
    this.params = conParams || { nextTime: C_NEXT_TIME }
  }

  async run() {
    this.params.callback?.([])
  }
}
