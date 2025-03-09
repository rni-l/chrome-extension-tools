// @ts-nocheck

export function initInterceptRequest() {
  console.log('inject script')
  // xhr中的方法拦截，eg: open、send etc.
  function hookFunction(funcName, config) {
    return function () {
      const args = Array.prototype.slice.call(arguments)
      // 将open参数存入xhr, 在其它事件回调中可以获取到。
      if (funcName === 'open') {
        this.xhr.open_args = args
      }
      if (config[funcName]) {
      // 配置的函数执行结果返回为true时终止调用
        const result = config[funcName].call(this, args, this.xhr)
        if (result)
          return result
      }
      return this.xhr[funcName].apply(this.xhr, arguments)
    }
  }

  // xhr中的属性和事件的拦截
  function getterFactory(attr, config) {
    return function () {
      const value = this.hasOwnProperty(`${attr}_`) ? this[`${attr}_`] : this.xhr[attr]
      const getterHook = (config[attr] || {}).getter
      return getterHook && getterHook(value, this) || value
    }
  }
  // 在赋值时触发该工厂函数（如onload等事件）
  function setterFactory(attr, config) {
    return function (value) {
      const _this = this
      const xhr = this.xhr
      const hook = config[attr] // 方法或对象
      this[`${attr}_`] = value
      if (attr.startsWith('on')) {
      // note：间接的在真实的xhr上给事件绑定函数
        xhr[attr] = function (e) {
        // e = configEvent(e, _this)
          const result = hook && config[attr].call(_this, xhr, e)
          result || value.call(_this, e)
        }
      }
      else {
        const attrSetterHook = (hook || {}).setter
        value = attrSetterHook && attrSetterHook(value, _this) || value
        try {
        // 并非xhr的所有属性都是可写的
          xhr[attr] = value
        }
        catch (e) {
          console.warn(`xhr的${attr}属性不可写`)
        }
      }
    }
  }

  // 核心拦截的handler
  function xhrHook(config) {
  // 存储真实的xhr构造器, 在取消hook时，可恢复
    window.realXhr = window.realXhr || XMLHttpRequest
    // 重写XMLHttpRequest构造函数
    XMLHttpRequest = function () {
      const xhr = new window.realXhr()
      // 真实的xhr实例存储到自定义的xhr属性中
      this.xhr = xhr
      // note: 遍历实例及其原型上的属性（实例和原型链上有相同属性时，取实例属性）
      for (const attr in xhr) {
        if (Object.prototype.toString.call(xhr[attr]) === '[object Function]') {
          this[attr] = hookFunction(attr, config) // 接管xhr function
        }
        else {
        // attention: 如果重写XMLHttpRequest，必须要全部重写，否则在ajax中不会触发success、error（原因是3.x版本是在load事件中执行success）
          Object.defineProperty(this, attr, { // 接管xhr attr、event
            get: getterFactory(attr, config),
            set: setterFactory(attr, config),
            enumerable: true,
          })
        }
      }
    }
    console.log('init request')
    return window.realXhr
  }

  // 解除xhr拦截，归还xhr管理权
  // function unXhrHook() {
  //   if (window[realXhr])
  //     XMLHttpRequest = window[realXhr]
  //   window[realXhr] = undefined
  // }

  xhrHook({
    open(args, xhr) {
    // return true // 返回true将终止请求，这个就是常规拦截的精髓了
    },
    onload(xhr) {
    // 对响应结果做处理
      window.postMessage({
        type: 'CET_GET_CONTENT_SCRIPT_REQUEST',
        data: {
          url: xhr.open_args[1],
          method: xhr.open_args[0],
          response: xhr.response,
          body: xhr._data,
          headers: xhr._headers,
          requestType: 'xhr-onload',
        },
      })
    },
    onreadystatechange(xhr) {
    // 对响应结果做处理
      if (xhr && xhr.readyState === 4) {
        window.postMessage({
          type: 'CET_GET_CONTENT_SCRIPT_REQUEST',
          data: {
            url: xhr.open_args[1],
            method: xhr.open_args[0],
            response: xhr.response,
            body: xhr._data,
            headers: xhr._headers,
            requestType: 'xhr-onreadystatechange',
          },
        })
      }
    },
    onloadend(xhr) {
      console.log(xhr)
      // 对响应结果做处理
      window.postMessage({
        type: 'CET_GET_CONTENT_SCRIPT_REQUEST',
        data: {
          url: xhr._url || xhr.open_args[1],
          method: xhr.open_args[0],
          response: xhr.response,
          body: xhr._data,
          headers: xhr._headers,
          requestType: 'xhr-onloadend',
        },
      })
    },
  })

  // 保存原始的 fetch 函数
  const originalFetch = window.fetch

  // 重写全局的 fetch 函数
  window.fetch = function (url, options) {
    // 调用原始的 fetch 函数
    return originalFetch(url, options).then((response) => {
    // 克隆响应对象进行读取，这样它就不会干扰实际的响应体读取
      const responseClone = response.clone()
      // 检查响应体类型，安全地打印响应体内容
      if (responseClone.headers.get('Content-Type')?.includes('application/json')) {
        responseClone.json().then((json) => {
          // console.log('capture fetch successful', url)
          window.postMessage({
            type: 'CET_GET_CONTENT_SCRIPT_REQUEST',
            data: JSON.parse(JSON.stringify({
              url,
              method: options?.method,
              response: json,
              body: options?.body,
              headers: options?.headers,
              requestType: 'fetch',
            })),
          })
        })
      }

      // 返回原始响应对象以不干扰后续的响应处理
      return response
    })
  }
  console.log('inject ok')
}
