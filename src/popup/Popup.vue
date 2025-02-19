<script setup lang="ts">
import { CetActuator } from "../../package/workflow";
import { task1Configure } from "../configure/task1";

// const sendToBackground = async () => {
//     const res = await sendMessage("sp2sv", {
//         first_name: 'John',
//         last_name: 'Doe'
//     }, "background");
//     console.log('service response', res)
// }
// onMessage("sv2sp", (message, sender) => {
//     console.log('service message', message)
//     return 'ok'
// })
async function start() {
  const ins = new CetActuator(task1Configure)
  const result = await ins.run()
  console.log(result)
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <button class="btn mt-2" @click="start">
      开始任务
    </button>
  </main>
</template>
