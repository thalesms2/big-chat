import { ref } from 'vue'

const snackbar = ref({ show: false, text: '', color: 'info' })
const queue: Array<{ text: string; color: string }> = []

function advance() {
  if (!queue.length) return
  const { text, color } = queue.shift()!
  snackbar.value = { show: true, text, color }
}

export function useSnackbar() {
  function showSnackbar(text: string, color = 'info') {
    queue.push({ text, color })
    if (!snackbar.value.show) advance()
  }

  function onSnackbarClose() {
    setTimeout(advance, 200)
  }

  return { snackbar, showSnackbar, onSnackbarClose }
}
