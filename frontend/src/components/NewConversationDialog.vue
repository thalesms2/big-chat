<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title class="pt-4">Nova Conversa</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="recipientId"
          label="ID do cliente destinatário"
          type="number"
          variant="outlined"
          density="comfortable"
          hide-details
          autofocus
          @keyup.enter="confirm"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="dialog = false">Cancelar</v-btn>
        <v-btn variant="flat" color="primary" :disabled="!recipientId" :loading="loading" @click="confirm">
          Abrir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { api } from '@/composables/useApi'
import { useSnackbar } from '@/composables/useSnackbar'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [recipientId: number, displayName: string]
}>()

const { showSnackbar } = useSnackbar()

const dialog = ref(props.modelValue)
const recipientId = ref<number | null>(null)
const loading = ref(false)

watch(() => props.modelValue, v => { dialog.value = v })
watch(dialog, v => {
  emit('update:modelValue', v)
  if (!v) recipientId.value = null
})

async function confirm() {
  if (!recipientId.value) return
  loading.value = true
  try {
    const { data } = await api.get(`/clients/id/${recipientId.value}`)
    emit('select', data.id, data.name)
    dialog.value = false
  } catch {
    showSnackbar('Cliente não encontrado', 'error')
  } finally {
    loading.value = false
  }
}
</script>
