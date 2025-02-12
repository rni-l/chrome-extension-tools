<script setup lang="ts">
import { storageDemo } from '~/logic/storage'

import { onMessage, sendMessage } from "webext-bridge/popup";

const sendToBackground = async () => {
    const res = await sendMessage("sp2sv", {
        first_name: 'John',
        last_name: 'Doe'
    }, "background");
    console.log('service response', res)
}
onMessage("sv2sp", (message, sender) => {
    console.log('service message', message)
    return 'ok'
})
function openOptionsPage() {
  browser.runtime.openOptionsPage()
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <Logo />
    <div @click="sendToBackground">Popup</div>
    <SharedSubtitle />

    <button class="btn mt-2" @click="openOptionsPage">
      Open Options
    </button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
  </main>
</template>
