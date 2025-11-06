<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div v-if="!userName" class="flex items-center justify-center min-h-screen">
      <NameModal :show="true" @submit="handleNameSubmit" />
    </div>
    
    <div v-else class="flex h-screen">
      <!-- Sidebar -->
      <ParticipantSidebar :participants="sessionStore.participantsArray" />
      
      <!-- Main Content -->
      <div class="flex-1 flex flex-col p-8 overflow-y-auto relative">
        <!-- Logout Button -->
        <button
          @click="handleLogout"
          class="absolute top-8 right-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
        >
          Logout
        </button>
        
        <div class="max-w-4xl mx-auto w-full">
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Voting Session</h1>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Session ID: <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{{ sessionId }}</code>
            </p>
            <div v-if="sessionStore.isAdmin" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Share this URL to invite others:</p>
              <div class="flex items-center gap-2">
                <code class="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded text-xs font-mono text-gray-900 dark:text-white break-all">{{ currentUrl }}</code>
                <button
                  @click="copyUrl"
                  class="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                  :class="{ 'bg-green-600 hover:bg-green-500': urlCopied }"
                >
                  {{ urlCopied ? '✓ Copied!' : 'Copy URL' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="!sessionStore.allVoted" class="mt-8">
            <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {{ sessionStore.hasVoted ? 'Waiting for others...' : 'Select your vote' }}
            </h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <button
                v-for="option in voteOptions"
                :key="option"
                @click="handleVote(option)"
                :disabled="sessionStore.hasVoted"
                :class="[
                  'rounded-lg p-6 shadow-md transition-all transform',
                  sessionStore.hasVoted && sessionStore.participants.get(sessionStore.userId)?.vote === option
                    ? 'ring-4 ring-blue-500 bg-blue-700 hover:bg-blue-600'
                    : sessionStore.hasVoted
                    ? 'bg-gray-400 opacity-50 cursor-not-allowed'
                    : 'bg-blue-700 hover:bg-blue-600 hover:scale-105 hover:shadow-lg cursor-pointer',
                  'text-3xl font-bold text-white'
                ]"
              >
                {{ option }}
              </button>
            </div>

            <div v-if="sessionStore.hasVoted" class="mt-6 text-center">
              <p class="text-gray-600 dark:text-gray-400">
                You voted: <span class="font-bold text-lg">{{ sessionStore.participants.get(sessionStore.userId)?.vote }}</span>
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Waiting for {{ sessionStore.participantsArray.filter(p => p.vote === null).length }} more participant(s)...
              </p>
            </div>
          </div>

          <VoteResults
            v-else
            :vote-results="sessionStore.voteResults"
            :overall-stats="sessionStore.overallStats"
            :is-admin="sessionStore.isAdmin"
            @reset="handleReset"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '../stores/session'
import NameModal from '../components/NameModal.vue'
import ParticipantSidebar from '../components/ParticipantSidebar.vue'
import VoteResults from '../components/VoteResults.vue'

const route = useRoute()
const sessionStore = useSessionStore()

const voteOptions = [0, 1, 2, 3, 5, 8, 13]
const userName = ref<string>('')
const urlCopied = ref<boolean>(false)

const sessionId = computed(() => route.params.sessionId as string)

const currentUrl = computed(() => {
  return window.location.href
})

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy URL:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = currentUrl.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
    }, 2000)
  }
}

const handleNameSubmit = async (name: string, role: string) => {
  sessionStore.saveUserName(name, role)
  userName.value = name
  
  // Initialize session after name is set
  await sessionStore.initializeSession(sessionId.value)
}

const handleVote = async (vote: number) => {
  if (!sessionStore.hasVoted) {
    await sessionStore.submitVote(vote)
  }
}

const handleReset = async () => {
  await sessionStore.resetVotes()
}

const handleLogout = async () => {
  await sessionStore.logout()
  userName.value = ''
}

onMounted(async () => {
  // Check if user name exists in localStorage
  const hasName = sessionStore.loadUserName()
  if (hasName) {
    userName.value = sessionStore.userName
    await sessionStore.initializeSession(sessionId.value)
  }
})

onUnmounted(() => {
  sessionStore.leaveSession()
})
</script>

