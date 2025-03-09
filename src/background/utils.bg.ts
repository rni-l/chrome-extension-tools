import { injectInterceptRequest } from '../../package/utils'

const targetDomains: string[] = [
]
const checkDomains: string[] = [
]
function injectInterceptRequestBg() {
  console.log('injectInterceptRequestBg')
  injectInterceptRequest('./dist/background/intercept-request.mjs', targetDomains)
}
export function checkAndInjectDomain(cacheTabInject: Record<string, boolean>, tabId: number, url?: string) {
  if (cacheTabInject[tabId])
    return
  console.log('check', url)
  if (checkDomains.some(v => (url || '').includes(v))) {
    cacheTabInject[tabId] = true
    injectInterceptRequestBg()
  }
}
