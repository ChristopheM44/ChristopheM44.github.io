<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ name, manches: { [n]: score }, total }]
  columns: Array,
  mancheCount: Number,
  leaders: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false }
})
defineEmits(['edit'])

const rows = computed(() => Array.from({ length: props.mancheCount }, (_, i) => i + 1))

function cell(col, n) {
  return col.manches?.[n]
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-white/5 bg-slate-800">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="text-slate-400 text-xs uppercase tracking-wider">
          <th class="sticky left-0 bg-slate-800 px-3 py-2 text-left font-semibold">Manche</th>
          <th
            v-for="col in columns"
            :key="col.name"
            :class="['px-3 py-2 text-right font-semibold whitespace-nowrap', leaders.includes(col.name) ? 'text-amber-400' : '']"
          >{{ col.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="mancheCount === 0">
          <td :colspan="columns.length + 1" class="px-3 py-6 text-center text-slate-400">Aucune manche jouée.</td>
        </tr>
        <tr v-for="n in rows" :key="n" class="border-t border-white/5">
          <td class="sticky left-0 bg-slate-800 px-3 py-1.5 text-slate-400 font-semibold">{{ n }}</td>
          <td
            v-for="col in columns"
            :key="col.name"
            @click="editable && $emit('edit', col.name, n)"
            :class="[
              'px-3 py-1.5 text-right tabular-nums',
              editable ? 'cursor-pointer hover:bg-slate-700/60' : '',
              cell(col, n) == null ? 'text-slate-600' : cell(col, n) < 0 ? 'text-red-400' : 'text-slate-200'
            ]"
          >{{ cell(col, n) ?? '–' }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-white/10 font-bold">
          <td class="sticky left-0 bg-slate-800 px-3 py-2 text-slate-300">Total</td>
          <td
            v-for="col in columns"
            :key="col.name"
            :class="[
              'px-3 py-2 text-right tabular-nums',
              leaders.includes(col.name) ? 'text-amber-400' : col.total < 0 ? 'text-red-400' : 'text-indigo-400'
            ]"
          >{{ col.total }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
