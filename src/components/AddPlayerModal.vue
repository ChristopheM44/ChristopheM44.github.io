<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add', 'close'])
const name = ref('')

function submitPlayer() {
  if (name.value.trim()) {
    emit('add', name.value.trim())
    name.value = ''
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-5">
    <div class="bg-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
      <div class="flex justify-between items-center mb-6">
        <span class="text-2xl font-bold">Ajouter un joueur</span>
        <button
          @click="$emit('close')"
          class="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition border-none cursor-pointer text-white"
        >
          ✕
        </button>
      </div>
      <input
        v-model="name"
        @keypress.enter="submitPlayer"
        placeholder="Nom du joueur"
        autofocus
        class="w-full px-4 py-4 rounded-xl bg-slate-700 text-white text-lg placeholder-slate-400 border-none outline-none mb-5 focus:ring-2 focus:ring-indigo-500"
      />
      <button
        @click="submitPlayer"
        class="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-semibold text-lg transition border-none cursor-pointer text-white"
      >
        Confirmer
      </button>
    </div>
  </div>
</template>
