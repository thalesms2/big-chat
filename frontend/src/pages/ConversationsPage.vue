<template>
  <div class="flex flex-col h-screen">
    <AppNavBar @new-conversation="newConvDialog = true" />

    <v-main class="flex-1 overflow-hidden">
      <div class="flex h-full">
        <div
          :class="[
            'border-r border-opacity-20 transition-all',
            selectedConversation ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full md:w-80 lg:w-96'
          ]"
          style="flex-direction: column;"
        >
          <div v-if="loadingConversations" class="flex justify-center items-center flex-1">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <ConversationList
            v-else
            :conversations="allConversations"
            :selected-id="selectedConversation?.id ?? null"
            @select="selectConversation"
          />
        </div>

        <div
          :class="[
            'flex-1 transition-all',
            !selectedConversation ? 'hidden md:flex' : 'flex'
          ]"
          style="flex-direction: column;"
        >
          <div v-if="selectedConversation" class="md:hidden">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              size="small"
              class="m-2"
              @click="selectedConversation = null"
            >
              Voltar
            </v-btn>
          </div>

          <ConversationView
            ref="conversationViewRef"
            :conversation="selectedConversation"
            :current-client-id="auth.clientId!"
            class="flex-1"
            @message-sent="handleMessageSent"
          />
        </div>
      </div>
    </v-main>

    <NewConversationDialog
      v-model="newConvDialog"
      @select="openOrCreateConversation"
    />

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top right"
      timeout="3000"
      @update:model-value="val => !val && onSnackbarClose()"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppNavBar from '@/components/AppNavBar.vue'
import ConversationList, { type ConversationItem } from '@/components/ConversationList.vue'
import ConversationView from '@/components/ConversationView.vue'
import NewConversationDialog from '@/components/NewConversationDialog.vue'
import { api } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar'
import { useSocket } from '@/composables/useSocket'

const auth = useAuthStore()
const { snackbar, showSnackbar, onSnackbarClose } = useSnackbar()
const socket = useSocket()

const clientData = ref<any>(null)
const loadingConversations = ref(false)
const selectedConversation = ref<ConversationItem | null>(null)
const newConvDialog = ref(false)
const conversationViewRef = ref<InstanceType<typeof ConversationView> | null>(null)

const allConversations = computed<ConversationItem[]>(() => {
  if (!clientData.value) return []
  const own: ConversationItem[] = (clientData.value.ownChats ?? []).map((c: any) => ({
    ...c,
    displayName: c.recipientName,
    isOwner: true,
  }))
  const open: ConversationItem[] = (clientData.value.openChats ?? []).map((c: any) => ({
    ...c,
    displayName: `Chat #${c.clientId}`,
    isOwner: false,
  }))
  return [...own, ...open].sort((a, b) => {
    const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
    const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
    return tb - ta
  })
})

onMounted(() => {
  loadConversations()
  socket.connect()
  socket.on('message:status', (data: { id: number; conversationId: number; status: string }) => {
    conversationViewRef.value?.updateMessageStatus(data.id, data.status)
    if (data.status === 'DELIVERED') {
      showSnackbar('Mensagem entregue ao destinatário', 'success')
    } else if (data.status === 'READ') {
      showSnackbar('Mensagem lida pelo destinatário', 'info')
    }
  })
  socket.on('message:new', (message: any) => {
    if (message.conversationId === selectedConversation.value?.id) {
      conversationViewRef.value?.addIncomingMessage(message)
      api.patch(`/messages/${message.id}/delivered`)
        .then(() => conversationViewRef.value?.markAsRead())
        .catch(() => {})
    } else {
      api.patch(`/messages/${message.id}/delivered`).catch(() => {})
      const conv = allConversations.value.find(c => c.id === message.conversationId)
      const name = conv?.displayName ?? `Conversa #${message.conversationId}`
      showSnackbar(`Nova mensagem de ${name}`, 'primary')
    }
    loadConversations(true)
  })
})

onUnmounted(() => {
  socket.disconnect()
})

async function loadConversations(silent = false) {
  if (!silent) loadingConversations.value = true
  try {
    const { data } = await api.get('/conversations')
    clientData.value = data
  } finally {
    if (!silent) loadingConversations.value = false
  }
}

function selectConversation(conv: ConversationItem) {
  selectedConversation.value = conv
}

function openOrCreateConversation(recipientId: number, displayName: string) {
  const existing = allConversations.value.find(c =>
    (c.isOwner && c.recipientId === recipientId) ||
    (!c.isOwner && c.clientId === recipientId)
  )
  if (existing) {
    selectedConversation.value = existing
    return
  }

  selectedConversation.value = {
    id: null,
    displayName,
    lastMessageContent: null,
    lastMessageTime: null,
    unreadCount: 0,
    clientId: auth.clientId!,
    recipientId,
    isOwner: true,
  }
}

async function handleMessageSent(conversationId: number) {
  await loadConversations()
  const found = allConversations.value.find(c => c.id === conversationId)
  if (found) {
    selectedConversation.value = found
  }
  if (clientData.value?.balance !== undefined) {
    const balance = (clientData.value.balance / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    showSnackbar(`Saldo restante: ${balance}`, 'secondary')
  }
}
</script>
