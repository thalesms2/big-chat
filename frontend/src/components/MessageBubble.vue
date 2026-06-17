<template>
  <div :class="['flex mb-3', isMine ? 'justify-end' : 'justify-start']">
    <div
      :class="['max-w-xs lg:max-w-md rounded-2xl px-3 py-2', isMine ? 'rounded-tr-sm bg-primary text-white' : 'rounded-tl-sm text-white']"
      :style="isMine ? '' : 'background-color: #424242'"
    >
      <p class="text-sm break-words">{{ message.content }}</p>
      <div :class="['flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start']">
        <v-chip size="x-small" variant="text" class="opacity-70 px-0 h-4">
          {{ message.type }}
        </v-chip>
        <v-chip
          size="x-small"
          variant="text"
          :class="['px-0 h-4', message.priority === 'URGENT' ? 'text-error' : 'opacity-70']"
        >
          {{ message.priority === 'URGENT' ? '↑ Urgente' : 'Normal' }}
        </v-chip>
        <span class="text-xs opacity-60">{{ formatTime(message.timestamp) }}</span>
        <v-icon :color="statusColor" size="12">{{ statusIcon }}</v-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Message {
  id: number
  content: string
  senderId: number
  type: string
  priority: string
  status: string
  timestamp: string
}

const props = defineProps<{ message: Message; currentClientId: number }>()

const isMine = computed(() => props.message.senderId === props.currentClientId)

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const statusIcon = computed(() => {
  const icons: Record<string, string> = {
    QUEUED: 'mdi-clock-outline',
    PROCESSING: 'mdi-clock-fast',
    SENT: 'mdi-check',
    DELIVERED: 'mdi-check-all',
    READ: 'mdi-check-all',
    FAILED: 'mdi-alert-circle-outline',
  }
  return icons[props.message.status] ?? 'mdi-check'
})

const statusColor = computed(() => {
  if (props.message.status === 'READ') return '#29B6F6'
  if (props.message.status === 'FAILED') return 'error'
  return ''
})
</script>
