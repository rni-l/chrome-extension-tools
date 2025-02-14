import type { ProtocolWithReturn } from 'webext-bridge'
import type { CetCsFn, CetCsFnInCs } from './package/types'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    CET_SP2CS_EXECUTE_TASK: ProtocolWithReturn<Parameters<CetCsFn>[0], ReturnType<CetCsFnInCs>>
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}
