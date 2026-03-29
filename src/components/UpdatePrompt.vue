<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh"
      class="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-4"
      style="background: linear-gradient(transparent, #0f172a 20%)"
    >
      <div class="max-w-xl mx-auto bg-indigo-600 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-xl">
        <div class="flex-1">
          <p class="text-white font-semibold text-sm">Mise à jour disponible</p>
          <p class="text-indigo-200 text-xs mt-0.5">Une nouvelle version de l'app est prête.</p>
        </div>
        <button
          @click="updateServiceWorker()"
          class="bg-white text-indigo-600 font-bold text-sm px-4 py-2 rounded-xl shrink-0 hover:bg-indigo-50 transition-colors"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
