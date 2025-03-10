<script setup lang="ts">
import { CetActuator, initSidePanel, handleResponseData, serializeJSON } from "../../package/main";
import { cetTest1Logger, task1Configure } from "../configure/task1";
import { EVENTS, toggleDebug } from '../../package/constants';
import { onMsgInSP, sendMsgBySP } from "../../package/message";
import { CetDestination, CetLogEntry } from "../../package/types";
// import { cetLogger } from '../../package/components/logger/ins.logger';

// setInterval(() => {
//   console.log(cetLogger.getLogs())
// }, 1000)
initSidePanel()
const sendToBackground = async () => {
    const res = await sendMsgBySP(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG });
    console.log('sp get tab', res)
}
const sendToCS = async () => {
  const  {data} = await sendMsgBySP<undefined, chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG }); 
  console.log('tab id', data, data?.id)
  const res = await sendMsgBySP('to-cs', 2, { destination: CetDestination.CS, tabId: data?.id });
  console.log('to cs', res)
}

onMsgInSP('test3', async (data) => {
  console.log('test3', data)
  return 'ok2'
})
onMsgInSP('to-sp2', async (data, params) => {
  console.log('to-sp2', data, params)
  return 'ok'
})
const logList = ref<CetLogEntry[]>([])
cetTest1Logger.logChange = (logs: CetLogEntry[]) => {
  logList.value = logs.map(v => v)
}
onMsgInSP(EVENTS.CS2SP_GET_REQUEST, async (data) => {
  if (!data)
    return
  if (typeof data.url !== 'string')
    return
  const res = {
    url: data.url || '',
    response: handleResponseData(data?.response),
    data: handleResponseData(data?.data),
    body: handleResponseData(data?.body),
    headers: handleResponseData(data?.headers),
    id: data.id,
  }
  cetTest1Logger.info(serializeJSON(res))
})
async function startTask1() {
  toggleDebug(true)
  const  {data} = await sendMsgBySP<undefined, chrome.tabs.Tab>(EVENTS.SP2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG }); 
  if (!data?.id) return
  cetTest1Logger.clearLogs()
  const ins = new CetActuator(task1Configure, {
    getTabId: async () => {
      return data.id as number
    },
  })
  const result = await ins.run()
  console.log(result)
  console.log(cetTest1Logger.getLogs())
}
</script>

<template>
  <main class="w-full px-4 py-5 text-center text-gray-700">
    <button class="btn mt-2" @click="sendToBackground">
      to bg
    </button>
    <button class="btn mt-2" @click="sendToCS">
      to cs
    </button>
    <button class="btn mt-2" @click="startTask1">
      start task1
    </button>
  </main>
</template>
