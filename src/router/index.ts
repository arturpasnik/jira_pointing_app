import { createRouter, createWebHistory } from 'vue-router'
import VotingSession from '../views/VotingSession.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        // Generate new session ID and redirect
        const sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        return `/s/${sessionId}`
      }
    },
    {
      path: '/s/:sessionId',
      name: 'session',
      component: VotingSession
    }
  ]
})

export default router

