import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMenuStore = defineStore('menu', () => {
  const showChangePasswordDialog = ref(false);
  const showAuditHistoryDialog = ref(false);
  const showWhatsappSettingsDialog = ref(false);
  const showUsersManagementDialog = ref(false);

  function openChangePassword() {
    showChangePasswordDialog.value = true;
  }

  function openAuditHistory() {
    showAuditHistoryDialog.value = true;
  }

  function openWhatsappSettings() {
    showWhatsappSettingsDialog.value = true;
  }

  function openUsersManagement() {
    showUsersManagementDialog.value = true;
  }

  function closeChangePassword() {
    showChangePasswordDialog.value = false;
  }

  function closeAuditHistory() {
    showAuditHistoryDialog.value = false;
  }

  function closeWhatsappSettings() {
    showWhatsappSettingsDialog.value = false;
  }

  function closeUsersManagement() {
    showUsersManagementDialog.value = false;
  }

  return {
    showChangePasswordDialog,
    showAuditHistoryDialog,
    showWhatsappSettingsDialog,
    showUsersManagementDialog,
    openChangePassword,
    openAuditHistory,
    openWhatsappSettings,
    openUsersManagement,
    closeChangePassword,
    closeAuditHistory,
    closeWhatsappSettings,
    closeUsersManagement,
  };
});
