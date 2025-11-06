import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Participant {
  id: string
  name: string
  vote: number | null
  joinedAt: string
}

export interface VoteResult {
  value: number
  voters: string[]
  count: number
}

export const useSessionStore = defineStore('session', () => {
  const sessionId = ref<string>('')
  const participants = ref<Map<string, Participant>>(new Map())
  const userName = ref<string>('')
  const userRole = ref<string>('User')
  const userId = ref<string>('')
  const channel = ref<RealtimeChannel | null>(null)
  const hasVoted = ref<boolean>(false)

  // Get user name and role from localStorage
  const loadUserName = () => {
    const storedName = localStorage.getItem('voting-app-username')
    const storedRole = localStorage.getItem('voting-app-role')
    if (storedName) {
      userName.value = storedName
    }
    if (storedRole) {
      userRole.value = storedRole
    }
    return !!storedName
  }

  // Save user name and role to localStorage
  const saveUserName = (name: string, role: string = 'User') => {
    userName.value = name
    userRole.value = role
    localStorage.setItem('voting-app-username', name)
    localStorage.setItem('voting-app-role', role)
  }

  // Check if current user is admin
  const isAdmin = computed(() => {
    return userRole.value === 'Admin'
  })

  // Generate unique user ID
  const generateUserId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize or join session
  const initializeSession = async (newSessionId: string) => {
    sessionId.value = newSessionId
    
    if (!userId.value) {
      userId.value = generateUserId()
    }

    // Set up realtime channel
    if (channel.value) {
      await channel.value.untrack()
      await supabase.removeChannel(channel.value as any)
    }

    const newChannel = supabase
      .channel(`session:${newSessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState()
        const newParticipants = new Map<string, Participant>()
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[]
          presences.forEach((presence) => {
            if (presence.userId && presence.name) {
              newParticipants.set(presence.userId, {
                id: presence.userId,
                name: presence.name,
                vote: presence.vote || null,
                joinedAt: presence.joinedAt || new Date().toISOString()
              })
            }
          })
        })
        
        participants.value = newParticipants
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
        // Check if session should expire (all participants left)
        setTimeout(() => {
          if (participants.value.size === 0 && channel.value) {
            expireSession()
          }
        }, 1000)
      })
      .on('broadcast', { event: 'reset-votes' }, () => {
        // Reset this user's vote when reset event is broadcast
        hasVoted.value = false
        if (channel.value && userId.value) {
          channel.value.track({
            userId: userId.value,
            name: userName.value,
            vote: null,
            joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString()
          })
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await newChannel.track({
            userId: userId.value,
            name: userName.value,
            vote: null,
            joinedAt: new Date().toISOString()
          })
        }
      })

    channel.value = newChannel
  }

  // Submit vote
  const submitVote = async (vote: number) => {
    if (!channel.value || !userId.value) return

    hasVoted.value = true
    
    await channel.value.track({
      userId: userId.value,
      name: userName.value,
      vote: vote,
      joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString()
    })
  }

  // Reset votes (broadcasts reset event to all participants)
  const resetVotes = async () => {
    if (!channel.value) return

    // Broadcast reset event to all participants
    await channel.value.send({
      type: 'broadcast',
      event: 'reset-votes',
      payload: {}
    })

    // Reset this user's vote immediately
    hasVoted.value = false
    if (userId.value) {
      await channel.value.track({
        userId: userId.value,
        name: userName.value,
        vote: null,
        joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString()
      })
    }
  }

  // Expire session (clean up when all participants leave)
  const expireSession = async () => {
    if (channel.value) {
      await channel.value.untrack()
      await supabase.removeChannel(channel.value as any)
      channel.value = null
    }
    participants.value.clear()
    sessionId.value = ''
    hasVoted.value = false
  }

  // Leave session
  const leaveSession = async () => {
    if (channel.value) {
      await channel.value.untrack()
      await supabase.removeChannel(channel.value as any)
      channel.value = null
    }
    participants.value.clear()
    hasVoted.value = false
  }

  // Logout - clear user data and session
  const logout = async () => {
    await leaveSession()
    userName.value = ''
    userRole.value = 'User'
    localStorage.removeItem('voting-app-username')
    localStorage.removeItem('voting-app-role')
  }

  // Computed: all participants as array
  const participantsArray = computed(() => {
    return Array.from(participants.value.values())
  })

  // Computed: check if all participants have voted
  const allVoted = computed(() => {
    const participantsList = participantsArray.value
    if (participantsList.length === 0) return false
    return participantsList.every(p => p.vote !== null)
  })

  // Computed: get vote results
  const voteResults = computed<VoteResult[]>(() => {
    const results: Map<number, VoteResult> = new Map()
    const voteOptions = [0, 1, 2, 3, 5, 8, 13]

    voteOptions.forEach(value => {
      results.set(value, {
        value,
        voters: [],
        count: 0
      })
    })

    participantsArray.value.forEach(participant => {
      if (participant.vote !== null) {
        const result = results.get(participant.vote)
        if (result) {
          result.voters.push(participant.name)
          result.count++
        }
      }
    })

    return Array.from(results.values())
  })

  // Computed: overall stats
  const overallStats = computed(() => {
    const results = voteResults.value
    const totalVotes = results.reduce((sum, r) => sum + r.count, 0)
    const average = totalVotes > 0
      ? results.reduce((sum, r) => sum + (r.value * r.count), 0) / totalVotes
      : 0
    
    // Find max vote value (highest voted number)
    const votesWithCounts = results.filter(r => r.count > 0)
    const maxVote = votesWithCounts.length > 0
      ? Math.max(...votesWithCounts.map(r => r.value))
      : 0
    
    // Find min vote value (lowest voted number)
    const minVote = votesWithCounts.length > 0
      ? Math.min(...votesWithCounts.map(r => r.value))
      : 0

    return {
      totalVotes,
      average: average.toFixed(2),
      maxVote,
      minVote
    }
  })

  return {
    sessionId,
    participants,
    participantsArray,
    userName,
    userRole,
    userId,
    hasVoted,
    allVoted,
    voteResults,
    overallStats,
    isAdmin,
    loadUserName,
    saveUserName,
    initializeSession,
    submitVote,
    resetVotes,
    expireSession,
    leaveSession,
    logout
  }
})

