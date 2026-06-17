<template>
  <div class="flex flex-col h-screen">
    <AppNavBar @new-conversation="newConversation" />

    <v-main>
      <v-container max-width="600" class="py-6">
        <div class="flex items-center gap-2 mb-6">
          <v-btn icon="mdi-arrow-left" variant="text" @click="$router.push('/conversations')" />
          <h1 class="text-xl font-semibold">Administração da conta</h1>
        </div>

        <div v-if="loading" class="flex justify-center py-12">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else-if="client">
          <v-card class="mb-4" rounded="xl" elevation="1">
            <v-card-text>
              <div class="flex items-center gap-4 mb-4">
                <v-avatar color="primary" size="56">
                  <v-icon color="white" size="28">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <p class="text-lg font-semibold">{{ client.name }}</p>
                  <p class="text-sm opacity-60">{{ client.documentId }}</p>
                </div>
                <v-spacer />
                <v-chip :color="client.active ? 'success' : 'error'" size="small">
                  {{ client.active ? 'Ativo' : 'Inativo' }}
                </v-chip>
              </div>

              <v-divider class="mb-4" />

              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 rounded-lg bg-surface-variant">
                  <p class="text-2xl font-bold text-primary">{{ formatBalance(client.balance) }}</p>
                  <p class="text-xs opacity-60 mt-1">Saldo</p>
                </div>
                <div class="text-center p-3 rounded-lg bg-surface-variant">
                  <p class="text-2xl font-bold">{{ formatBalance(client.limit) }}</p>
                  <p class="text-xs opacity-60 mt-1">Limite</p>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="mb-4" rounded="xl" elevation="1">
            <v-card-title class="text-base pt-4 pb-2">Inserir Créditos</v-card-title>
            <v-card-text>
              <v-text-field
                v-model.number="creditAmount"
                label="Valor (R$)"
                type="number"
                variant="outlined"
                density="comfortable"
                prefix="R$"
                min="1"
                hide-details
              />
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-spacer />
              <v-btn
                color="success"
                variant="flat"
                :loading="savingCredit"
                :disabled="!creditAmount || creditAmount <= 0"
                @click="addCredit"
              >
                Adicionar crédito
              </v-btn>
            </v-card-actions>
          </v-card>

          <v-card rounded="xl" elevation="1">
            <v-card-title class="text-base pt-4 pb-2">Plano</v-card-title>
            <v-card-text>
              <v-radio-group v-model="selectedPlan" hide-details inline>
                <v-radio label="Pré-pago" value="PREPAID" color="primary" />
                <v-radio label="Pós-pago" value="POSPAID" color="primary" />
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-spacer />
              <v-btn
                color="primary"
                variant="flat"
                :loading="savingPlan"
                :disabled="selectedPlan === client.planType"
                @click="updatePlan"
              >
                Salvar plano
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-container>
    </v-main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import { api } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar'

const auth = useAuthStore()
const router = useRouter()
const { snackbar, showSnackbar } = useSnackbar()

const client = ref<any>(null)
const loading = ref(false)
const savingCredit = ref(false)
const savingPlan = ref(false)
const creditAmount = ref<number | null>(null)
const selectedPlan = ref<'PREPAID' | 'POSPAID'>('PREPAID')

onMounted(loadClient)

async function loadClient() {
  loading.value = true
  try {
    const { data } = await api.get(`/clients/${auth.clientDocument}`)
    client.value = data
    selectedPlan.value = data.planType
  } catch {
    showSnackbar('Erro ao carregar dados da conta.', 'error')
  } finally {
    loading.value = false
  }
}

async function addCredit() {
  if (!creditAmount.value || creditAmount.value <= 0) return
  savingCredit.value = true
  try {
    await api.put(`/clients/${auth.clientDocument}`, {
      action: 'balance',
      value: Number(String(creditAmount.value.toFixed(2)).replaceAll('.', '')),
    })
    showSnackbar(`R$ ${creditAmount.value} adicionado com sucesso.`, 'success')
    creditAmount.value = null
    await loadClient()
  } catch {
    showSnackbar('Erro ao adicionar crédito.', 'error')
  } finally {
    savingCredit.value = false
  }
}

function newConversation() {
  router.push('/conversations')
}

async function updatePlan() {
  savingPlan.value = true
  try {
    await api.put(`/clients/${auth.clientDocument}`, { planType: selectedPlan.value })
    showSnackbar('Plano atualizado com sucesso.', 'success')
    await loadClient()
  } catch {
    showSnackbar('Erro ao atualizar plano.', 'error')
  } finally {
    savingPlan.value = false
  }
}

function formatBalance(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
}
</script>
