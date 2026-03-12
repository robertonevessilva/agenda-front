<template>
  <q-page class="page q-pa-md">
    <q-card flat bordered class="reset-card">
      <q-card-section>
        <div class="text-h5">Redefinir senha</div>
        <div class="text-subtitle2 text-grey-7">
          Informe o token recebido por e-mail e a nova senha.
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="handleResetPassword">
          <q-input v-model="form.token" label="Token de recuperação" outlined class="q-mb-sm" />
          <q-input
            v-model="form.newPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Nova senha (mín. 6)"
            outlined
            class="q-mb-sm"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-input
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            label="Confirmar nova senha"
            outlined
            class="q-mb-md"
          >
            <template #append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="grey-7" label="Voltar ao login" @click="goToLogin" />
            <q-btn type="submit" color="primary" label="Redefinir senha" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  token: '',
  newPassword: '',
  confirmPassword: '',
});

onMounted(() => {
  const tokenFromQuery = route.query.token;
  if (typeof tokenFromQuery === 'string' && tokenFromQuery) {
    form.token = tokenFromQuery;
  }
});

async function handleResetPassword() {
  if (form.newPassword.length < 6) {
    notifyError('A nova senha deve ter pelo menos 6 caracteres.');
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    notifyError('A confirmação da nova senha não confere.');
    return;
  }

  loading.value = true;
  try {
    const response = await authStore.resetPassword({
      token: form.token,
      newPassword: form.newPassword,
    });
    $q.notify({ type: 'positive', message: response.message });
    await router.replace('/');
  } catch (error) {
    notifyError(error);
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  void router.replace('/');
}

function notifyError(error: unknown) {
  if (typeof error === 'string') {
    $q.notify({ type: 'negative', message: error });
    return;
  }

  if (error instanceof AxiosError) {
    const backendMessage = error.response?.data?.message;
    const backendError = error.response?.data?.error;
    const status = error.response?.status;

    // Handle specific HTTP status codes with user-friendly messages
    if (status === 401) {
      $q.notify({
        type: 'negative',
        message: 'Token de recuperação inválido ou expirado.'
      });
      return;
    }

    if (status === 403) {
      $q.notify({
        type: 'negative',
        message: 'Acesso negado. Você não tem permissão para realizar esta ação.'
      });
      return;
    }

    if (status === 400) {
      // For bad requests, show the backend message if available
      const message = typeof backendMessage === 'string'
        ? backendMessage
        : Array.isArray(backendMessage) && backendMessage.length > 0
          ? String(backendMessage[0])
          : backendError || 'Token de recuperação inválido ou dados incorretos.';
      $q.notify({ type: 'negative', message });
      return;
    }

    if (status === 404) {
      $q.notify({
        type: 'negative',
        message: 'Recurso não encontrado.'
      });
      return;
    }

    if (status === 500) {
      $q.notify({
        type: 'negative',
        message: 'Erro interno do servidor. Tente novamente mais tarde.'
      });
      return;
    }

    // For other status codes or if no specific status
    const message = typeof backendMessage === 'string'
      ? backendMessage
      : Array.isArray(backendMessage) && backendMessage.length > 0
        ? String(backendMessage[0])
        : backendError || 'Erro ao redefinir senha.';
    $q.notify({ type: 'negative', message });
    return;
  }

  // Handle Error objects
  if (error instanceof Error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Ocorreu um erro.'
    });
    return;
  }

  $q.notify({ type: 'negative', message: 'Ocorreu um erro inesperado.' });
}
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
}

.reset-card {
  max-width: 500px;
  margin: 40px auto;
}
</style>

