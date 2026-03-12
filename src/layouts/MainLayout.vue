<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Agenda Pessoal</q-toolbar-title>
        <q-btn-dropdown
          v-if="authStore.isAuthenticated"
          flat
          color="white"
          :label="displayName"
          icon="account_circle"
          class="q-ml-sm"
          dropdown-icon="arrow_drop_down"
          title="Clique para ver opções"
        >
          <q-list>
            <q-item clickable v-close-popup @click="menuStore.openChangePassword()">
              <q-item-section>Alterar senha</q-item-section>
              <q-tooltip style="font-size:16px">Mostra a tela pra alteração de senha</q-tooltip>
            </q-item>
            <q-item v-if="isAdmin" clickable v-close-popup @click="menuStore.openUsersManagement()">
              <q-item-section style="font-size:16px">Gerenciar usuários</q-item-section>
              <q-tooltip>Abre o gerenciamento de usuários</q-tooltip>
            </q-item>
            <q-item clickable v-close-popup @click="menuStore.openAuditHistory()">
              <q-item-section>Histórico</q-item-section>
              <q-tooltip style="font-size:16px">Mostra o histórico de operações</q-tooltip>
            </q-item>
            <q-item clickable v-close-popup @click="menuStore.openWhatsappSettings()">
              <q-item-section>WhatsApp</q-item-section>
              <q-tooltip style="font-size:16px">Configura envio de lembretes no WhatsApp</q-tooltip>
            </q-item>
            <q-item clickable v-close-popup @click="handleLogout">
              <q-item-section>Sair</q-item-section>
              <q-tooltip style="font-size:16px">Encerra sua sessão</q-tooltip>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';
import { useMenuStore } from 'src/stores/menu-store';

const router = useRouter();
const authStore = useAuthStore();
const menuStore = useMenuStore();
const displayName = computed(() => authStore.user?.name || authStore.user?.email || 'Usuário');
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');

onMounted(() => {
  void authStore.restoreSession();
});

async function handleLogout() {
  await authStore.logout();
  void router.push('/');
}
</script>
