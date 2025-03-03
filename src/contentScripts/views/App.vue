<script setup lang="ts">
import { EVENTS } from '../../../package/constants';
import { task1Configure } from '../../configure/task1';
import { findDeepTargetByName } from '../../../package/utils';
import { sendMsgByCS, onMsgInCS } from '../../../package/message';
import { CetDestination } from '../../../package/types';
// function initContentScript() {
//   onMessage(EVENTS.SP2CS_EXECUTE_TASK, async ({ data }) => {
//     if (!data?.name) return { next: false }
//     const csFn = findDeepTargetByName(task1Configure, data.name)?.csFn
//     if (csFn) {
//       const csResult = await csFn(data)
//       return csResult
//     } else {
//       return { next: true }
//     }
//   })
// }
const tabId = ref(0)

onMsgInCS('bg2cs',  async (res) => {
  console.log('bg2cs', res)
})
onMsgInCS('to-cs',  async (res) => {
  console.log('cs2cs', res)
  return 'ok'
})
onMsgInCS('to-cs2',  async (res) => {
  console.log('cs2cs2', res)
  return 'ok'
})

// initContentScript()
const getTab = async () => {
  const { data, tabId, messageId} = await sendMsgByCS<undefined,chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, undefined, { destination: CetDestination.BG })
  console.log('tab', data, data?.id, tabId, messageId)
  // tabId.value = data.id || 0
}
const sendMsg = async () => {
  console.log('sendMsg')
  // const tab = await sendMsgByCS<chrome.tabs.Tab>(EVENTS.CS2BG_GET_CURRENT_TAB, {}, 1)
  sendMsgByCS(EVENTS.SP2CS_EXECUTE_TASK, { name: 'task1' }, { destination: CetDestination.BG }).then((res) => {
    console.log('SP2CS_EXECUTE_TASK', res)
  })
}
const sendMsg2 = async () => {
  sendMsgByCS('test3', { name: 'task1' }, { destination: CetDestination.SP }).then((res) => {
    console.log('test3', res)
  })
}
onMounted(async () => {
  await getTab()
  // sendMsg()
  sendMsg2()
})
</script>

<template>
  <div />
</template>
