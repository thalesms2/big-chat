<template>
  <div class="flex flex-col h-full border-r border-opacity-20">
    <div class="p-3 border-b border-opacity-10">
      <v-text-field
        v-model="search"
        placeholder="Buscar conversa..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        rounded
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      <v-list v-if="filtered.length" density="compact" nav>
        <v-list-item
          v-for="conv in filtered"
          :key="conv.id ?? `pending-${conv.recipientId}`"
          :active="conv.id === selectedId"
          active-color="primary"
          rounded="lg"
          class="mb-1"
          @click="$emit('select', conv)"
        >
          <template #prepend>
            <v-avatar color="primary" size="40">
              <span class="text-white text-sm font-medium">
                {{ initials(conv.displayName) }}
              </span>
            </v-avatar>
          </template>

          <v-list-item-title class="font-medium">{{ conv.displayName }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">
            {{ conv.lastMessageContent || 'Sem mensagens' }}
          </v-list-item-subtitle>

          <template #append>
            <div class="flex flex-col items-end gap-1">
              <span class="text-xs opacity-60">{{ formatTime(conv.lastMessageTime) }}</span>
              <v-badge
                v-if="conv.unreadCount"
                :content="conv.unreadCount"
                color="primary"
                inline
              />
            </div>
          </template>
        </v-list-item>
      </v-list>

      <div v-else class="flex flex-col items-center justify-center h-full opacity-50 p-4 text-center">
        <v-icon size="48" class="mb-2">mdi-chat-outline</v-icon>
        <p class="text-sm">Nenhuma conversa encontrada</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

export interface ConversationItem {
  id: number | null
  displayName: string
  lastMessageContent?: string | null
  lastMessageTime?: string | null
  unreadCount: number
  clientId: number
  recipientId: number
  isOwner: boolean
}

const props = defineProps<{
  conversations: ConversationItem[]
  selectedId?: number | null
}>()

defineEmits<{ select: [conv: ConversationItem] }>()

const search = ref('')

const filtered = computed(() =>
  props.conversations.filter(c =>
    c.displayName.toLowerCase().includes(search.value.toLowerCase())
  )
)

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function formatTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>
