<script setup>
defineProps({
  title: String,
  message: String,
  confirmLabel: { type: String, default: 'Confirmer' },
  cancelLabel: { type: String, default: 'Annuler' },
  danger: { type: Boolean, default: false }
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div class="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center px-5" @click.self="$emit('cancel')">
    <div class="bg-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl">
      <div class="text-lg font-bold mb-2">{{ title }}</div>
      <p class="text-sm text-slate-300 mb-5 whitespace-pre-line">{{ message }}</p>
      <div class="flex gap-2">
        <button
          @click="$emit('cancel')"
          class="flex-1 py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer bg-slate-700 text-white hover:bg-slate-600"
        >{{ cancelLabel }}</button>
        <button
          @click="$emit('confirm')"
          :class="[
            'flex-1 py-2.5 rounded-xl font-semibold text-sm transition border-none cursor-pointer text-white',
            danger ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-500 hover:bg-indigo-400'
          ]"
        >{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>
