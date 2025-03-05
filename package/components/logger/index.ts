/*
 * @Author: Lu
 * @Date: 2025-03-04 16:50:35
 * @LastEditTime: 2025-03-05 16:41:03
 * @LastEditors: Lu
 * @Description: 浏览器插件日志组件
 */

import type { CetLogChange, CetLogEntry, CetLogOptions } from '../../types'
import dayjs from 'dayjs'
import { EVENTS } from '../../constants'
import { sendMsgByCS, sendMsgBySP } from '../../message'
import { CetDestination, CetLogLevel } from '../../types'

const defaultMaxCacheSize = 500

export class CetLogger {
  private isShowInConsole: boolean
  private options: CetLogOptions
  public logCache: CetLogEntry[] = []
  private maxCacheSize = defaultMaxCacheSize
  public logChange?: CetLogChange
  constructor(options: CetLogOptions = {}) {
    this.options = {
      level: options.level || CetLogLevel.INFO,
      timestamp: options.timestamp ?? true,
      prefix: options.prefix || '[Chrome Extension]',
      color: options.color ?? true,
      isSyncToBG: options.isSyncToBG ?? false,
      isSyncToSP: options.isSyncToSP ?? false,
      isCS: options.isCS ?? false,
      formatTimePattern: options.formatTimePattern || 'YYYY-MM-DD HH:mm:ss',
    }
    this.isShowInConsole = options.isShowInConsole ?? false
    this.maxCacheSize = options.maxCacheSize || defaultMaxCacheSize
    this.logChange = options.logChange
  }

  private getTimestamp(): string {
    return dayjs().format(this.options.formatTimePattern)
  }

  private formatMessage(level: CetLogLevel, message: string, ...args: any[]): string {
    const parts: string[] = []

    if (this.options.timestamp) {
      parts.push(`[${this.getTimestamp()}]`)
    }

    // parts.push(this.options.prefix || '')
    parts.push(`[${level.toUpperCase()}]`)
    parts.push(message)
    if (args.length > 0) {
      parts.push('\n')
    }
    args.forEach((arg) => {
      parts.push(arg)
    })

    return parts.join(' ')
  }

  private shouldLog(level: CetLogLevel): boolean {
    const levels = Object.values(CetLogLevel)
    const currentLevelIndex = levels.indexOf(this.options.level || CetLogLevel.INFO)
    const targetLevelIndex = levels.indexOf(level)
    return targetLevelIndex >= currentLevelIndex
  }

  private addLog(item: CetLogEntry): void {
    this.logCache.unshift(item)

    // 如果超过最大缓存数量，删除最早的日志
    if (this.logCache.length > this.maxCacheSize) {
      this.logCache.pop()
    }
    this.logChange?.(this.logCache)
  }

  public log(item: CetLogEntry): void {
    this.addLog(item)
  }

  // @ts-ignore
  private syncToBG(item: CetLogEntry): void {
    if (this.options.isCS && this.options.isSyncToBG) {
      sendMsgByCS(EVENTS.CS2BG_LOG, item, { destination: CetDestination.BG })
    }
    else if (this.options.isSP && this.options.isSyncToBG) {
      sendMsgBySP(EVENTS.SP2BG_LOG, item, { destination: CetDestination.BG })
    }
  }

  // @ts-ignore
  private syncToSP(item: CetLogEntry): void {
    if (!(this.options.isCS && this.options.isSyncToSP))
      return
    sendMsgByCS(EVENTS.CS2SP_LOG, item, { destination: CetDestination.SP })
  }

  private addToCache(level: CetLogLevel, message: string, formattedMessage: string, args: any[]): void {
    const entry: CetLogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      formattedMessage,
      args,
    }
    this.addLog(entry)

    // this.syncToBG(entry)
    // this.syncToSP(entry)
  }

  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog(CetLogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage(CetLogLevel.DEBUG, message, ...args)
      if (this.isShowInConsole) {
        console.debug(formattedMessage)
      }
      this.addToCache(CetLogLevel.DEBUG, message, formattedMessage, args)
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.shouldLog(CetLogLevel.INFO)) {
      const formattedMessage = this.formatMessage(CetLogLevel.INFO, message, ...args)
      if (this.isShowInConsole) {
        console.info(formattedMessage)
      }
      this.addToCache(CetLogLevel.INFO, message, formattedMessage, args)
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog(CetLogLevel.WARN)) {
      const formattedMessage = this.formatMessage(CetLogLevel.WARN, message, ...args)
      if (this.isShowInConsole) {
        console.warn(formattedMessage)
      }
      this.addToCache(CetLogLevel.WARN, message, formattedMessage, args)
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog(CetLogLevel.ERROR)) {
      const formattedMessage = this.formatMessage(CetLogLevel.ERROR, message, ...args)
      if (this.isShowInConsole) {
        console.error(formattedMessage)
      }
      this.addToCache(CetLogLevel.ERROR, message, formattedMessage, args)
    }
  }

  public setOptions(options: Partial<CetLogOptions>): void {
    this.options = { ...this.options, ...options }
  }

  // 获取所有缓存的日志
  public getLogs(): CetLogEntry[] {
    return [...this.logCache]
  }

  // 获取指定级别的日志
  public getLogsByLevel(level: CetLogLevel): CetLogEntry[] {
    return this.logCache.filter(log => log.level === level)
  }

  // 清空日志缓存
  public clearLogs(): void {
    this.logCache = []
    this.logChange?.([])
  }

  // 获取日志缓存大小
  public getCacheSize(): number {
    return this.logCache.length
  }
}

export const cetBGLogger = new CetLogger({
  isCS: false,
  isSP: false,
  isSyncToBG: false,
  isSyncToSP: false,
  level: CetLogLevel.DEBUG,
  isShowInConsole: true,
})
export const cetCSLogger = new CetLogger({
  isCS: true,
  isSP: false,
  isSyncToBG: true,
  isSyncToSP: true,
  level: CetLogLevel.DEBUG,
  isShowInConsole: true,
})
export const cetSPLogger = new CetLogger({
  isCS: false,
  isSP: true,
  isSyncToBG: true,
  isSyncToSP: false,
  level: CetLogLevel.DEBUG,
  isShowInConsole: true,
})
