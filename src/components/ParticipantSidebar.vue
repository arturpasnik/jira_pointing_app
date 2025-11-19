<template>
  <div class="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 h-full overflow-y-auto">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Participants</h3>
    <div class="space-y-2">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span class="text-gray-900 dark:text-white font-medium">
            {{ participant.name }}
            <span v-if="participant.role === 'Admin'" class="text-xs text-blue-600 dark:text-blue-400 ml-1">(Admin)</span>
          </span>
          <span
            v-if="participant.vote !== null"
            class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded"
          >
            ✓
          </span>
          <span
            v-else
            class="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded"
          >
            ...
          </span>
        </div>
      </div>
      <div v-if="participants.length === 0" class="text-gray-500 dark:text-gray-400 text-sm">
        No participants yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Participant } from '../stores/session'

defineProps<{
  participants: Participant[]
}>()
</script>

