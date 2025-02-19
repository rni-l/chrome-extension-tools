<script setup lang="ts">
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { EVENTS } from '../../../package/constants';
import { task1Configure } from '../../configure/task1';
import { findDeepTargetByName } from '../../../package/utils';

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

// initContentScript()

</script>

<template>
  <div />
</template>
