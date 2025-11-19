import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Participant {
  id: string
  name: string
  role: 'Admin' | 'User'
  vote: number | null
  joinedAt: string
  isVotingFinished?: boolean
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
  const votingFinished = ref<boolean>(false)

  // Get user name and role from localStorage
  const loadUserName = () => {
    const storedName = localStorage.getItem('voting-app-username')
    const storedRole = localStorage.getItem('voting-app-role')
    const storedUserId = localStorage.getItem('voting-app-userid')
    if (storedName) {
      userName.value = storedName
    }
    if (storedRole) {
      userRole.value = storedRole
    }
    if (storedUserId) {
      userId.value = storedUserId
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
      localStorage.setItem('voting-app-userid', userId.value)
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
                role: presence.role || 'User',
                vote: presence.vote || null,
                joinedAt: presence.joinedAt || new Date().toISOString(),
                isVotingFinished: presence.isVotingFinished
              })
            }
          })
        })

        participants.value = newParticipants

        // Check if any admin has finished voting
        const adminFinished = Array.from(newParticipants.values()).some(p => {
          if (p.role === 'Admin') {
            console.log('Checking admin for finish status:', p.name, p.isVotingFinished)
          }
          return p.role === 'Admin' && p.isVotingFinished
        })

        console.log('Admin finished voting?', adminFinished)

        if (adminFinished) {
          votingFinished.value = true
        }
        // Removed else block to make votingFinished sticky. 
        // It is reset by resetVotes() action and 'reset-votes' broadcast event.

        // Single Admin Logic: Check if there are other admins
        if (userRole.value === 'Admin') {
          const otherAdmins = Array.from(newParticipants.values()).filter(p =>
            p.role === 'Admin' && p.id !== userId.value
          )

          if (otherAdmins.length > 0) {
            // If there are other admins, check who joined last
            // The requirement is "If someone enter room as admin others Must be set to User"
            // This implies the NEWER admin keeps the role, and OLDER admins get demoted.

            const myJoinTime = new Date(participants.value.get(userId.value)?.joinedAt || 0).getTime()

            // Check if any other admin joined AFTER me (shouldn't happen if I just joined, but possible in race conditions)
            // OR if I am the older admin and a new one appeared.

            // Actually, simpler logic:
            // If I see another admin, and their joinedAt is GREATER (later) than mine, I must demote myself.
            // Wait, if "someone enter room as admin", they are the NEW one.
            // So if I am an EXISTING admin, and I see a NEW admin (joinedAt > my joinedAt), I demote myself.

            const newerAdminExists = otherAdmins.some(admin => {
              const adminJoinTime = new Date(admin.joinedAt).getTime()
              return adminJoinTime > myJoinTime
            })

            if (newerAdminExists) {
              console.log('Newer admin detected, demoting self to User')
              userRole.value = 'User'
              saveUserName(userName.value, 'User')
              // Update presence with new role
              if (channel.value) {
                channel.value.track({
                  userId: userId.value,
                  name: userName.value,
                  role: 'User',
                  vote: null, // Reset vote when demoted just in case
                  joinedAt: participants.value.get(userId.value)?.joinedAt
                })
              }
            }
          }
        }
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
            role: userRole.value,
            vote: null,
            joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString(),
            isVotingFinished: false
          })
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await newChannel.track({
            userId: userId.value,
            name: userName.value,
            role: userRole.value,
            vote: null,
            joinedAt: new Date().toISOString(),
            isVotingFinished: false
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
      role: userRole.value,
      vote: vote,
      joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString(),
      isVotingFinished: votingFinished.value
    })
  }

  // Reset votes (broadcasts reset event to all participants)
  const resetVotes = async () => {
    if (!channel.value) return

    votingFinished.value = false

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
        role: userRole.value,
        vote: null,
        joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString(),
        isVotingFinished: false
      })
    }
  }

  // Finish voting manually
  const finishVoting = async () => {
    console.log('finishVoting called', { channel: !!channel.value, userId: userId.value, role: userRole.value })
    if (!channel.value || !userId.value || userRole.value !== 'Admin') return

    votingFinished.value = true
    console.log('Setting votingFinished to true locally and tracking...')

    await channel.value.track({
      userId: userId.value,
      name: userName.value,
      role: userRole.value,
      vote: null, // Admin doesn't vote
      joinedAt: participants.value.get(userId.value)?.joinedAt || new Date().toISOString(),
      isVotingFinished: true
    })
    console.log('Tracked finish voting')
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
    localStorage.removeItem('voting-app-userid')
  }

  // Computed: all participants as array
  const participantsArray = computed(() => {
    return Array.from(participants.value.values())
  })

  // Computed: check if all participants have voted
  const allVoted = computed(() => {
    const participantsList = participantsArray.value.filter(p => p.role !== 'Admin')
    if (participantsList.length === 0) return false
    return participantsList.every(p => p.vote !== null)
  })

  // Computed: show results if all voted or voting manually finished
  const showResults = computed(() => {
    return allVoted.value || votingFinished.value
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
    showResults,
    voteResults,
    overallStats,
    isAdmin,
    loadUserName,
    saveUserName,
    initializeSession,
    submitVote,
    resetVotes,
    finishVoting,
    expireSession,
    leaveSession,
    logout
  }
})

