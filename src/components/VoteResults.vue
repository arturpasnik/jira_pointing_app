<template>
  <div class="mt-8">
    <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Vote Results</h2>
    
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      <div
        v-for="result in voteResults"
        :key="result.value"
        class="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md"
      >
        <div class="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          {{ result.value }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
          {{ result.count }} {{ result.count === 1 ? 'vote' : 'votes' }}
        </div>
        <div class="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
          <div
            v-for="voter in result.voters"
            :key="voter"
            class="text-xs text-gray-700 dark:text-gray-300 py-1"
          >
            {{ voter }}
          </div>
          <div v-if="result.voters.length === 0" class="text-xs text-gray-400 italic">
            No votes
          </div>
        </div>
      </div>
    </div>

    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Overall Statistics</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Total Votes</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ overallStats.totalVotes }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Average</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ overallStats.average }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Max</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ overallStats.maxVote }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Min</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ overallStats.minVote }}</div>
        </div>
      </div>
    </div>

    <div v-if="isAdmin" class="text-center">
      <button
        @click="$emit('reset')"
        class="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
      >
        Reset Votes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VoteResult } from '../stores/session'

defineProps<{
  voteResults: VoteResult[]
  overallStats: {
    totalVotes: number
    average: string
    maxVote: number
    minVote: number
  }
  isAdmin: boolean
}>()

defineEmits<{
  reset: []
}>()
</script>

