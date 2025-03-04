/*
 * @Author: Lu
 * @Date: 2025-03-04 11:28:04
 * @LastEditTime: 2025-03-04 16:45:16
 * @LastEditors: Lu
 * @Description:
 */

// 将全局声明移到单独的类型声明文件中
type XMLHttpRequestCallback = (this: XMLHttpRequest, ev: Event) => any

interface XhrHookConfig {
  [key: string]: {
    callback?: (args: any[], xhr: XMLHttpRequest) => any
    getter?: (value: any, xhr: any) => any
    setter?: (value: any, xhr: any) => any
  }
}

interface RequestData {
  url: string
  method?: string
  response: any
  requestType: 'xhr-onload' | 'xhr-onreadystatechange' | 'xhr-onloadend' | 'fetch'
}

interface CustomXMLHttpRequest extends XMLHttpRequest {
  xhr: XMLHttpRequest
  open_args?: any[]
  [key: string]: any
}
export function initInterceptRequest() {
  // 创建一个安全的全局存储
  // @ts-ignore
  const globalStore: { realXhr?: typeof XMLHttpRequest } = window

  function injectCaptureRequest(): void {
    function hookFunction(funcName: string, config: XhrHookConfig): (...args: any[]) => any {
      return function (this: CustomXMLHttpRequest, ...args: any[]) {
        if (funcName === 'open') {
          this.open_args = args
        }

        const hookConfig = config[funcName]
        if (hookConfig?.callback) {
          const result = hookConfig.callback.call(this, args, this.xhr)
          if (result !== undefined) {
            return result
          }
        }

        return this.xhr[funcName as keyof XMLHttpRequest]?.(...args)
      }
    }

    function getterFactory(attr: string, config: XhrHookConfig): () => any {
      return function (this: CustomXMLHttpRequest): any {
        const value = Object.prototype.hasOwnProperty.call(this, `${attr}_`)
          ? this[`${attr}_`]
          : this.xhr[attr as keyof XMLHttpRequest]

        const hookConfig = config[attr]
        return hookConfig?.getter ? hookConfig.getter(value, this) : value
      }
    }

    function setterFactory(attr: string, config: XhrHookConfig): (value: any) => void {
      return function (this: CustomXMLHttpRequest, value: any): void {
        const xhr = this.xhr
        const hookConfig = config[attr]
        this[`${attr}_`] = value

        if (attr.startsWith('on')) {
          const eventAttr = attr as keyof XMLHttpRequest
          if (typeof value === 'function') {
          // @ts-ignore
            xhr[eventAttr] = ((e: Event) => {
              const result = hookConfig?.callback?.call(this, [e], xhr)
              if (result !== true) {
                value.call(this, e)
              }
            }) as XMLHttpRequestCallback
          }
          else {
          // @ts-ignore
            xhr[eventAttr] = null
          }
        }
        else {
          const newValue = hookConfig?.setter ? hookConfig.setter(value, this) : value
          try {
          // 使用类型断言来处理动态属性访问
            ;(xhr as any)[attr] = newValue
          }
          catch (e) {
            console.warn(`xhr的${attr}属性不可写`)
          }
        }
      }
    }

    function xhrHook(config: XhrHookConfig): typeof XMLHttpRequest {
      globalStore.realXhr = globalStore.realXhr || XMLHttpRequest

      // eslint-disable-next-line no-global-assign
      XMLHttpRequest = function (this: CustomXMLHttpRequest) {
        const xhr = new globalStore.realXhr!()
        this.xhr = xhr

        // 复制原始 XMLHttpRequest 的属性
        for (const attr in xhr) {
        // @ts-ignore
          if (typeof xhr[attr] === 'function') {
            this[attr] = hookFunction(attr, config)
          }
          else {
            Object.defineProperty(this, attr, {
              get: getterFactory(attr, config),
              set: setterFactory(attr, config),
              enumerable: true,
            })
          }
        }
      } as unknown as typeof XMLHttpRequest

      // Object.setPrototypeOf(XHRProxy.prototype, XMLHttpRequest.prototype)
      // return XHRProxy
      return globalStore.realXhr
    }

    function unXhrHook(): void {
      if (globalStore.realXhr) {
      // eslint-disable-next-line no-global-assign
        XMLHttpRequest = globalStore.realXhr
        globalStore.realXhr = undefined
      }
    }

    // 配置 XHR 拦截
    xhrHook({
      open: {
        callback(args: any[], xhr: XMLHttpRequest) {
        // 可以在这里添加请求拦截逻辑
        },
      },
      onload: {
        // @ts-ignore
        callback(args: any[], xhr: CustomXMLHttpRequest) {
          postRequestMessage({
            url: xhr.open_args?.[1],
            method: xhr.open_args?.[0],
            response: xhr.response,
            requestType: 'xhr-onload',
          })
        },
      },
      onreadystatechange: {
        // @ts-ignore
        callback(args: any[], xhr: CustomXMLHttpRequest) {
          if (xhr?.readyState === 4) {
            postRequestMessage({
              url: xhr.open_args?.[1],
              method: xhr.open_args?.[0],
              response: xhr.response,
              requestType: 'xhr-onreadystatechange',
            })
          }
        },
      },
      onloadend: {
        // @ts-ignore
        callback(args: any[], xhr: CustomXMLHttpRequest) {
          postRequestMessage({
            url: xhr.open_args?.[1],
            method: xhr.open_args?.[0],
            response: xhr.response,
            requestType: 'xhr-onloadend',
          })
        },
      },
    })

    // 重写 fetch
    const originalFetch = window.fetch.bind(window)
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString()

      return originalFetch(input, init).then((response) => {
        const responseClone = response.clone()

        if (responseClone.headers.get('Content-Type')?.includes('application/json')) {
          responseClone.json().then((json) => {
            postRequestMessage({
              url,
              method: init?.method,
              response: json,
              requestType: 'fetch',
            })
          })
        }

        return response
      })
    }

    console.log('inject ok')
  }

  // 统一的消息发送函数
  function postRequestMessage(data: RequestData): void {
    window.postMessage({
      type: 'CS2SP_GET_REQUEST',
      data,
    })
  }

  injectCaptureRequest()
}
