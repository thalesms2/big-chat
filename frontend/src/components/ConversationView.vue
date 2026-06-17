<template>
  <div class="flex flex-col h-full">
    <div v-if="!conversation" class="flex-1 flex flex-col items-center justify-center opacity-40">
      <v-icon size="80" class="mb-4">mdi-chat-outline</v-icon>
      <p class="text-lg">Selecione uma conversa</p>
    </div>

    <template v-else>
      <div class="flex items-center gap-3 px-4 py-3 border-b border-opacity-10">
        <template v-if="showSearch">
          <v-text-field
            v-model="searchQuery"
            placeholder="Buscar mensagens..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            autofocus
            class="flex-1"
            @keyup.escape="closeSearch"
          />
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeSearch" />
        </template>
        <template v-else>
          <v-avatar color="primary" size="38">
            <span class="text-white text-sm font-medium">{{ initials(conversation.displayName) }}</span>
          </v-avatar>
          <div>
            <p class="font-medium">{{ conversation.displayName }}</p>
            <p class="text-xs opacity-60">
              ID {{ conversation.isOwner ? conversation.recipientId : conversation.clientId }}
              <v-chip v-if="!conversation.id" size="x-small" color="warning" class="ml-1">Nova</v-chip>
            </p>
          </div>
          <v-spacer />
          <v-btn
            v-if="conversation.id"
            icon="mdi-magnify"
            variant="text"
            size="small"
            @click="openSearch"
          />
          <v-btn
            v-if="conversation.id"
            icon="mdi-refresh"
            variant="text"
            size="small"
            :loading="loading"
            @click="loadMessages"
          />
        </template>
      </div>

      <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-2">
        <div v-if="loading" class="flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <template v-else>
          <MessageBubble
            v-for="msg in filteredMessages"
            :key="msg.id"
            :message="msg"
            :current-client-id="currentClientId"
          />
          <div v-if="!filteredMessages.length" class="flex flex-col items-center justify-center h-full opacity-40 py-8">
            <v-icon size="48" class="mb-2">mdi-message-outline</v-icon>
            <p class="text-sm">
              {{ searchQuery ? 'Nenhuma mensagem encontrada' : (conversation.id ? 'Nenhuma mensagem ainda' : 'Envie a primeira mensagem') }}
            </p>
          </div>
        </template>
      </div>

      <div class="border-t border-opacity-10 px-4 py-3">
        <div class="flex justify-end gap-2 mb-2">
          <v-select
            v-model="form.type"
            :items="messageTypes"
            label="Tipo"
            variant="outlined"
            density="compact"
            hide-details
            class="max-w-32"
          />
          <v-select
            v-model="form.priority"
            :items="priorities"
            label="Prioridade"
            variant="outlined"
            density="compact"
            hide-details
            class="max-w-36"
          />
        </div>
        <div class="flex gap-2">
          <v-text-field
            v-model="form.content"
            placeholder="Digite uma mensagem..."
            variant="outlined"
            density="compact"
            hide-details
            @keyup.enter="sendMessage"
          />
          <v-btn
            icon="mdi-send"
            color="primary"
            :loading="sending"
            :disabled="!form.content.trim()"
            @click="sendMessage"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, defineExpose, onMounted, onUnmounted } from 'vue'
import MessageBubble from './MessageBubble.vue'
import { api } from '@/composables/useApi'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ConversationItem } from './ConversationList.vue'

const props = defineProps<{
  conversation: ConversationItem | null
  currentClientId: number
}>()

const emit = defineEmits<{ 'message-sent': [conversationId: number] }>()

const { showSnackbar } = useSnackbar()

const messages = ref<any[]>([])
const loading = ref(false)
const sending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const showSearch = ref(false)
const searchQuery = ref('')

const filteredMessages = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return messages.value
  return messages.value.filter(m => m.content?.toLowerCase().includes(q))
})

const messageTypes = ['SMS', 'WHATS']
const priorities = [
  { title: 'Normal', value: 'NORMAL' },
  { title: 'Urgente', value: 'URGENT' },
]

const form = ref({ content: '', type: 'WHATS', priority: 'NORMAL' })

watch(() => props.conversation?.id, async (id) => {
  messages.value = []
  showSearch.value = false
  searchQuery.value = ''
  if (id) {
    await loadMessages()
    await markAsRead()
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

function handleWindowFocus() {
  markAsRead()
}

function handleVisibilityChange() {
  if (!document.hidden) markAsRead()
}

async function loadMessages() {
  if (!props.conversation?.id) return
  loading.value = true
  try {
    const { data } = await api.get(`/conversations/${props.conversation.id}/messages`)
    messages.value = data.messages ?? []
  } finally {
    loading.value = false
  }
  await nextTick()
  scrollToBottom()
}

async function sendMessage() {
  if (!form.value.content.trim() || !props.conversation) return
  sending.value = true
  try {
    const conv = props.conversation
    const recipientId = conv.isOwner ? conv.recipientId : conv.clientId
    const { data } = await api.post('/messages', {
      type: form.value.type,
      ...(conv.id ? { conversationId: conv.id } : {}),
      senderId: props.currentClientId,
      recipientId,
      content: form.value.content.trim(),
      priority: form.value.priority,
      cost: '1.00',
      timestamp: new Date().toISOString(),
    })
    form.value.content = ''
    messages.value.push(data)
    await nextTick()
    scrollToBottom()
    emit('message-sent', data.conversationId)
  } catch (err: any) {
    if (err?.response?.status === 422) {
      showSnackbar('Saldo insuficiente para enviar a mensagem', 'error')
    } else {
      showSnackbar('Erro ao enviar mensagem', 'error')
    }
  } finally {
    sending.value = false
  }
}

function openSearch() {
  showSearch.value = true
}

function closeSearch() {
  showSearch.value = false
  searchQuery.value = ''
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

async function markAsRead() {
  if (!props.conversation?.id) return
  try {
    await api.patch(`/messages/conversation/${props.conversation.id}/read`)
    messages.value.forEach(msg => {
      if (msg.recipientId === props.currentClientId &&
          (msg.status === 'DELIVERED' || msg.status === 'SENT')) {
        msg.status = 'READ'
      }
    })
  } catch {}
}

function updateMessageStatus(messageId: number, status: string) {
  const msg = messages.value.find(m => m.id === messageId)
  if (msg) msg.status = status
}

function addIncomingMessage(message: any) {
  if (!messages.value.find(m => m.id === message.id)) {
    messages.value.push(message)
    nextTick(() => scrollToBottom())
  }
}

defineExpose({ updateMessageStatus, addIncomingMessage, markAsRead })
</script>
