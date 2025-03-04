import { injectInterceptRequest } from '../../package/utils'

const targetDomains = [
  'https://www.baidu.com/*',
]
const checkDomains = [
  'https://www.baidu.com',
]
export function injectInterceptRequestBg() {
  injectInterceptRequest('./dist/background/intercept-request.mjs', targetDomains)
}
export function checkAndInjectDomain(url?: string) {
  console.log('checkAndInjectDomain',url)
  if (checkDomains.some(v => (url || '').includes(v))) {
    console.log('will inject')
    injectInterceptRequestBg()
  }
}