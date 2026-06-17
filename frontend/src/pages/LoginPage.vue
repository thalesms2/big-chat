<template>
  <v-main class="flex items-center justify-center min-h-screen bg-background">
    <v-card class="w-full max-w-sm mx-4" elevation="2" rounded="xl">
      <div class="px-6 pt-8 pb-4 text-center">
        <v-icon size="48" color="primary" class="mb-2">mdi-chat-processing</v-icon>
        <h1 class="text-2xl font-bold text-primary">BigChat</h1>
        <p class="text-sm opacity-60 mt-1">Faça login para continuar</p>
      </div>

      <v-card-text class="px-6 pb-6">
        <v-text-field
          v-model="maskedDocument"
          label="CPF / CNPJ"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-card-account-details"
          :error-messages="errorMsg"
          placeholder="000.000.000-00"
          @input="handleInput"
          @keyup.enter="login"
        />

        <v-btn
          block
          color="primary"
          size="large"
          rounded="lg"
          :loading="loading"
          :disabled="rawDocument.length < 11"
          class="mt-2"
          @click="login"
        >
          Entrar
        </v-btn>
      </v-card-text>
    </v-card>
  </v-main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const maskedDocument = ref('')
const rawDocument = ref('')
const errorMsg = ref('')
const loading = ref(false)

function applyMask(digits: string): string {
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 14)
  rawDocument.value = digits
  maskedDocument.value = applyMask(digits)
  errorMsg.value = ''
}

async function login() {
  if (rawDocument.value.length < 11) return
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await api.post('/auth', { document: rawDocument.value })
    auth.setToken(data.access_token)
    router.push('/conversations')
  } catch {
    errorMsg.value = 'Documento não encontrado ou inválido.'
  } finally {
    loading.value = false
  }
}
</script>
