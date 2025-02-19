<script setup lang="ts">
import { CetActuator } from "../../package/workflow";
import { task1Configure } from "../configure/task1";
import { onMessage, sendMessage } from "webext-bridge/popup";

const sendToBackground = async () => {
    const res = await sendMessage("sp2sv", {
        first_name: 'John',
        last_name: 'Doe'
    }, "background");
    console.log('service response', res)
}
onMessage("sv2sp", async ({ data }: any) => {
  console.log('sv2sp', data)
  const tabId = data.tabId
  const res = await sendMessage('sp2cs', {
    tabId,
    message: 'hello from sidepanel',
  }, { context: 'content-script', tabId })
  console.log(res)
  return 'ok'
})
onMessage('cs2sp', (data: any) => {
  console.log(data)
  return {
    data,
    type: 'popup'
  }
})
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
    <button class="btn mt-2" @click="start">
      开始任务
    </button>
  </main>
</template>
