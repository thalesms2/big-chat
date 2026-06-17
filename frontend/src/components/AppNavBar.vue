<template>
  <v-app-bar elevation="1" color="surface">
    <v-app-bar-title>
      <span class="font-semibold text-primary">BigChat</span>
    </v-app-bar-title>

    <template #append>
      <div class="flex items-center gap-2 mr-2">
        <v-chip size="small" color="primary" variant="tonal" prepend-icon="mdi-account">
          {{ clientDocument }}
        </v-chip>

        <v-btn
          variant="text"
          prepend-icon="mdi-plus"
          size="small"
          @click="$emit('new-conversation')"
        >
          Nova conversa
        </v-btn>

        <v-btn
          variant="text"
          icon="mdi-account-cog"
          size="small"
          :to="'/account'"
        />

        <v-btn
          variant="text"
          icon="mdi-logout"
          size="small"
          @click="handleLogout"
        />
      </div>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

defineEmits<{ 'new-conversation': [] }>()

const auth = useAuthStore()
const router = useRouter()
const clientDocument = auth.clientDocument

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
