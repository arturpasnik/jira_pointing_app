<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Voting App</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">Please enter your name to continue:</p>
      <input
        v-model="name"
        @keyup.enter="handleSubmit"
        type="text"
        placeholder="Your name"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        autofocus
      />
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role:</label>
      <select
        v-model="role"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="User">User</option>
        <option value="Admin">Admin</option>
      </select>
      <button
        @click="handleSubmit"
        :disabled="!name.trim()"
        class="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Continue
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  submit: [name: string, role: string]
}>()

const name = ref('')
const role = ref('User')

const handleSubmit = () => {
  if (name.value.trim()) {
    emit('submit', name.value.trim(), role.value)
  }
}
</script>

