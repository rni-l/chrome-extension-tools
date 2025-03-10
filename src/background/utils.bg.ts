import { injectInterceptRequest } from '../../package/utils'

const targetDomains: string[] = [
  'https://www.baidu.com/*',
]
const checkDomains: string[] = [
  'https://www.baidu.com',
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
