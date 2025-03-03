<script setup lang="ts">
import { CetActuator } from "../../package/workflow";
import { task1Configure } from "../configure/task1";
import { EVENTS } from '../../package/constants';
import { onMsgInSP, sendMsgBySP } from "../../package/message";
import { CetDestination } from "../../package/types";
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

// onMessage("sv2sp", async ({ data }: any) => {
//   console.log('sv2sp', data)
//   const tabId = data.tabId
//   const res = await sendMessage('sp2cs', {
//     tabId,
//     message: 'hello from sidepanel',
//   }, { context: 'content-script', tabId })
//   console.log(res)
//   return 'ok'
// })
// onMessage('cs2sp', (data: any) => {
//   console.log(data)
//   return {
//     data,
//     type: 'popup'
//   }
// })
// onMessage("sv2sp", (message) => {
//   console.log('service message', message)
//   return 'ok'
// })
async function start() {
  const ins = new CetActuator(task1Configure)
  console.log(ins, task1Configure)
  const result = await ins.run()
  console.log(result)
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
  </main>
</template>
