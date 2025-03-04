<script setup lang="ts">
import { EVENTS } from '../../../package/constants';
import { task1Configure } from '../../configure/task1';
import { findDeepTargetByName } from '../../../package/utils';
import { sendMsgByCS, onMsgInCS } from '../../../package/message';
import { initContentScript } from '../../../package/workflow';
import { CetDestination } from '../../../package/types';
import { toggleDebug } from '../../../package/constants';

toggleDebug(true)
initContentScript(task1Configure)
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
const sendMsg2 = async () => {
  sendMsgByCS('test3', { name: 'task1' }, { destination: CetDestination.SP }).then((res) => {
    console.log('test3', res)
  })
}
onMounted(async () => {
  await getTab()
  // sendMsg2()
})
</script>

<template>
  <div />
</template>
