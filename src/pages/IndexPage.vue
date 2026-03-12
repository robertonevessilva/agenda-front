<template>
  <q-page class="page q-pa-md">
    <div v-if="!authStore.isAuthenticated" class="auth-wrapper">
      <q-card flat bordered class="auth-card">
        <q-card-section>
          <div class="text-h5">Entrar na Agenda</div>
          <div class="text-subtitle2 text-grey-7">Faça login ou cadastre-se para começar.</div>
        </q-card-section>

        <q-card-section>
          <q-tabs v-model="authTab" dense>
            <q-tab name="login" label="Login" />
            <q-tab name="register" label="Cadastro" />
          </q-tabs>
        </q-card-section>

        <q-card-section>
          <q-form v-if="authTab === 'login'" @submit.prevent="handleLogin">
            <q-input v-model="loginForm.email" type="email" label="Email" outlined class="q-mb-sm" />
            <q-input
              v-model="loginForm.password"
              :type="showLoginPassword ? 'text' : 'password'"
              label="Senha"
              outlined
              class="q-mb-sm"
            >
              <template #append>
                <q-icon
                  :name="showLoginPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showLoginPassword = !showLoginPassword"
                />
              </template>
            </q-input>
            <div v-if="hasRecaptchaKey" ref="captchaContainerRef" class="q-mb-sm" />
            <div v-else class="text-negative text-caption q-mb-sm">
              CAPTCHA não configurado no frontend (`VITE_RECAPTCHA_SITE_KEY`).
            </div>
            <div v-if="captchaLoadError" class="text-negative text-caption q-mb-md">
              {{ captchaLoadError }}
            </div>
            <q-btn type="submit" label="Entrar" color="primary" :loading="loadingAuth">
              <q-tooltip style="font-size:16px">Faz login na sua conta</q-tooltip>
            </q-btn>
            <q-btn
              flat
              color="primary"
              label="Esqueci minha senha"
              class="q-ml-sm"
              @click="openForgotPasswordDialog"
            />
          </q-form>

          <q-form v-else @submit.prevent="handleRegister">
            <q-input v-model="registerForm.name" label="Nome" outlined class="q-mb-sm" />
            <q-input v-model="registerForm.email" type="email" label="Email" outlined class="q-mb-sm" />
            <q-input
              v-model="registerForm.whatsappPhone"
              label="WhatsApp (formato internacional)"
              hint="Ex: +5581999999999"
              outlined
              class="q-mb-sm"
            />
            <q-input
              v-model="registerForm.password"
              :type="showRegisterPassword ? 'text' : 'password'"
              label="Senha"
              outlined
              class="q-mb-sm"
            >
              <template #append>
                <q-icon
                  :name="showRegisterPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showRegisterPassword = !showRegisterPassword"
                />
              </template>
            </q-input>
            <q-input
              v-model="registerForm.confirmPassword"
              :type="showRegisterConfirmPassword ? 'text' : 'password'"
              label="Confirmar senha"
              outlined
              class="q-mb-sm"
            >
              <template #append>
                <q-icon
                  :name="showRegisterConfirmPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showRegisterConfirmPassword = !showRegisterConfirmPassword"
                />
              </template>
            </q-input>
            <q-input v-model="registerForm.timezone" label="Timezone" outlined class="q-mb-md" />
            <q-btn type="submit" label="Cadastrar" color="primary" :loading="loadingRegister" />
          </q-form>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="agenda-wrapper">
      <div class="row items-center q-col-gutter-md q-mb-md">
        <div class="col">
          <div class="text-h5">Olá, {{ authStore.user?.name || authStore.user?.email }}</div>
          <div class="text-subtitle2 text-grey-7">Gerencie seus lembretes e compromissos.</div>
        </div>
        <div class="col-auto">
          <!-- O menu agora está no nome do usuário na barra superior -->
        </div>
      </div>

      <div class="row items-center q-gutter-sm q-mb-md">
        <q-btn
          flat
          color="primary"
          :outline="agendaView !== 'both'"
          label="Ver ambos"
          @click="agendaView = 'both'"
        >
          <q-tooltip style="font-size:16px" anchor="top middle">Mostra lembretes e compromissos</q-tooltip>
        </q-btn>
        <q-btn
          flat
          color="primary"
          :outline="agendaView !== 'reminders'"
          label="Ver lembretes"
          @click="agendaView = 'reminders'"
        >
          <q-tooltip style="font-size:16px">Mostra só lembretes</q-tooltip>
        </q-btn>
        <q-btn
          flat
          color="primary"
          :outline="agendaView !== 'appointments'"
          label="Ver compromissos"
          @click="agendaView = 'appointments'"
        >
          <q-tooltip style="font-size:16px">Mostra só compromissos</q-tooltip>
        </q-btn>
        <q-space />
        <q-btn
          v-if="agendaView !== 'appointments'"
          color="primary"
          icon="add"
          label="Novo lembrete"
          @click="openCreateReminderDialog"
        >
          <q-tooltip style="font-size:16px">Abre o formulário para criar lembrete</q-tooltip>
        </q-btn>
        <q-btn
          v-if="agendaView !== 'reminders'"
          color="primary"
          icon="event"
          label="Novo compromisso"
          @click="openCreateAppointmentDialog"
        >
          <q-tooltip style="font-size:16px">Abre o formulário para criar compromisso</q-tooltip>
        </q-btn>
      </div>

      <div class="row q-col-gutter-lg">
        <div v-if="agendaView !== 'appointments'" class="col-12 col-sm-6">
          <div class="text-h6 q-mb-sm">Lembretes</div>
          <q-list bordered separator class="bg-white rounded-borders">
            <q-item
              v-for="item in agendaStore.reminders"
              :key="item.id"
              :class="{ 'item-overdue': isReminderOverdue(item) }"
            >
              <q-item-section>
                <q-item-label>{{ item.title }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(item.remindAt) }} - {{ item.priority }}
                  <span v-if="isReminderOverdue(item)" class="text-negative"> - Atrasado</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat dense round icon="visibility" @click="viewReminder(item.id)">
                    <q-tooltip style="font-size:16px">Ver detalhes do lembrete</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="edit" @click="editReminder(item.id)">
                    <q-tooltip style="font-size:16px">Editar lembrete</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="delete" color="negative" @click="removeReminder(item.id)">
                    <q-tooltip style="font-size:16px">Excluir lembrete</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="agendaStore.reminders.length === 0">
              <q-item-section>
                <q-item-label caption>Nenhum lembrete cadastrado.</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-if="agendaView !== 'reminders'" class="col-12 col-sm-6">
          <div class="text-h6 q-mb-sm">Compromissos</div>
          <q-list bordered separator class="bg-white rounded-borders">
            <q-item
              v-for="item in agendaStore.appointments"
              :key="item.id"
              :class="{ 'item-overdue': isAppointmentOverdue(item) }"
            >
              <q-item-section>
                <q-item-label>{{ item.title }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(item.startsAt) }}{{ item.location ? ` - ${item.location}` : '' }}
                  <span v-if="isAppointmentOverdue(item)" class="text-negative"> - Atrasado</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat dense round icon="visibility" @click="viewAppointment(item.id)">
                    <q-tooltip  style="font-size:16px">Ver detalhes do compromisso</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="edit" @click="editAppointment(item.id)">
                    <q-tooltip  style="font-size:16px">Editar compromisso</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="delete" color="negative" @click="removeAppointment(item.id)">
                    <q-tooltip  style="font-size:16px">Excluir compromisso</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="agendaStore.appointments.length === 0">
              <q-item-section>
                <q-item-label caption>Nenhum compromisso cadastrado.</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>

    <q-dialog v-model="showReminderFormDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 520px">
        <q-card-section>
          <div class="text-h6">{{ reminderForm.id ? 'Editar lembrete' : 'Novo lembrete' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="handleSaveReminder">
            <q-input v-model="reminderForm.title" label="Título" outlined class="q-mb-sm" />
            <q-input
              v-model="reminderForm.remindAt"
              type="datetime-local"
              label="Quando lembrar"
              outlined
              class="q-mb-sm"
            />
            <q-select
              v-model="reminderForm.priority"
              :options="priorityOptions"
              label="Prioridade"
              outlined
              class="q-mb-sm"
            />
            <q-input v-model="reminderForm.notes" type="textarea" label="Notas" outlined class="q-mb-md" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-7" label="Cancelar" @click="closeReminderFormDialog" />
              <q-btn type="submit" color="primary" :label="reminderForm.id ? 'Salvar' : 'Adicionar'" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAppointmentFormDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 520px">
        <q-card-section>
          <div class="text-h6">{{ appointmentForm.id ? 'Editar compromisso' : 'Novo compromisso' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="handleSaveAppointment">
            <q-input v-model="appointmentForm.title" label="Título" outlined class="q-mb-sm" />
            <q-input
              v-model="appointmentForm.startsAt"
              type="datetime-local"
              label="Data e hora"
              outlined
              class="q-mb-sm"
            />
            <q-input v-model="appointmentForm.location" label="Local" outlined class="q-mb-sm" />
            <q-input
              v-model="appointmentForm.notes"
              type="textarea"
              label="Observações"
              outlined
              class="q-mb-md"
            />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-7" label="Cancelar" @click="closeAppointmentFormDialog" />
              <q-btn type="submit" color="primary" :label="appointmentForm.id ? 'Salvar' : 'Adicionar'" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="menuStore.showChangePasswordDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Alterar senha</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="handleChangePassword">
            <q-input
              v-model="changePasswordForm.currentPassword"
              :type="showPassword.current ? 'text' : 'password'"
              label="Senha atual"
              outlined
              class="q-mb-sm"
            >
              <template #append>
                <q-icon
                  :name="showPassword.current ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword.current = !showPassword.current"
                />
              </template>
            </q-input>
            <q-input
              v-model="changePasswordForm.newPassword"
              :type="showPassword.new ? 'text' : 'password'"
              label="Nova senha (mín. 6)"
              outlined
              class="q-mb-sm"
            >
              <template #append>
                <q-icon
                  :name="showPassword.new ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword.new = !showPassword.new"
                />
              </template>
            </q-input>
            <q-input
              v-model="changePasswordForm.confirmNewPassword"
              :type="showPassword.confirm ? 'text' : 'password'"
              label="Confirmar nova senha"
              outlined
              class="q-mb-md"
            >
              <template #append>
                <q-icon
                  :name="showPassword.confirm ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword.confirm = !showPassword.confirm"
                />
              </template>
            </q-input>
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-7" label="Cancelar" @click="closeChangePasswordDialog">
                <q-tooltip style="font-size:16px">Fecha a janela sem salvar</q-tooltip>
              </q-btn>
              <q-btn
                type="submit"
                color="primary"
                label="Salvar senha"
                :loading="loadingChangePassword"
              >
                <q-tooltip style="font-size:16px">Salva a nova senha</q-tooltip>
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showForgotPasswordDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 460px">
        <q-card-section>
          <div class="text-h6">Recuperar senha</div>
          <div class="text-caption text-grey-7">
            Informe seu e-mail para receber o link de recuperação.
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="handleForgotPassword">
            <q-input v-model="forgotPasswordEmail" type="email" label="Email" outlined class="q-mb-md" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-7" label="Cancelar" @click="closeForgotPasswordDialog" />
              <q-btn type="submit" color="primary" label="Enviar" :loading="loadingForgotPassword" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="menuStore.showWhatsappSettingsDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 460px">
        <q-card-section>
          <div class="text-h6">Configurar WhatsApp</div>
          <div class="text-caption text-grey-7">
            Receba lembretes de compromissos próximos no seu WhatsApp.
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="handleSaveWhatsappSettings">
            <q-input
              v-model="whatsappSettingsForm.whatsappPhone"
              label="Telefone (formato internacional)"
              hint="Ex: +5581999999999"
              outlined
              class="q-mb-sm"
            />
            <q-checkbox
              v-model="whatsappSettingsForm.whatsappOptIn"
              label="Ativar lembretes de compromissos no WhatsApp"
              class="q-mb-md"
            />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat color="grey-7" label="Cancelar" @click="closeWhatsappSettingsDialog" />
              <q-btn
                type="submit"
                color="primary"
                label="Salvar"
                :loading="loadingWhatsappSettings"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showReminderDetailsDialog">
      <q-card style="min-width: 320px; width: 100%; max-width: 520px">
        <q-card-section>
          <div class="text-h6">Detalhes do lembrete</div>
        </q-card-section>
        <q-card-section v-if="selectedReminder">
          <div><strong>Título:</strong> {{ selectedReminder.title }}</div>
          <div><strong>Quando lembrar:</strong> {{ formatDate(selectedReminder.remindAt) }}</div>
          <div><strong>Prioridade:</strong> {{ selectedReminder.priority }}</div>
          <div><strong>Status:</strong> {{ selectedReminder.done ? 'Concluído' : 'Pendente' }}</div>
          <div><strong>Notas:</strong> {{ selectedReminder.notes || '-' }}</div>
          <div><strong>Criado em:</strong> {{ formatDate(selectedReminder.createdAt) }}</div>
          <div><strong>Atualizado em:</strong> {{ formatDate(selectedReminder.updatedAt) }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Fechar" v-close-popup>
            <q-tooltip style="font-size:16px">Fecha os detalhes do lembrete</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAppointmentDetailsDialog">
      <q-card style="min-width: 320px; width: 100%; max-width: 520px">
        <q-card-section>
          <div class="text-h6">Detalhes do compromisso</div>
        </q-card-section>
        <q-card-section v-if="selectedAppointment">
          <div><strong>Título:</strong> {{ selectedAppointment.title }}</div>
          <div><strong>Data e hora:</strong> {{ formatDate(selectedAppointment.startsAt) }}</div>
          <div><strong>Local:</strong> {{ selectedAppointment.location || '-' }}</div>
          <div><strong>Status:</strong> {{ selectedAppointment.done ? 'Concluído' : 'Pendente' }}</div>
          <div><strong>Observações:</strong> {{ selectedAppointment.notes || '-' }}</div>
          <div><strong>Criado em:</strong> {{ formatDate(selectedAppointment.createdAt) }}</div>
          <div><strong>Atualizado em:</strong> {{ formatDate(selectedAppointment.updatedAt) }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Fechar" v-close-popup>
            <q-tooltip style="font-size:16px">Fecha os detalhes do compromisso</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="menuStore.showAuditHistoryDialog">
      <q-card style="min-width: 320px; width: 100%; max-width: 900px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Histórico de operações</div>
          <div class="row items-center q-gutter-sm">
            <q-btn
              flat
              dense
              icon="delete_sweep"
              color="negative"
              :loading="loadingAuditHistory"
              @click="handleClearAuditHistory"
            >
              <q-tooltip style="font-size:16px">Apaga todo o seu histórico</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="refresh"
              :loading="loadingAuditHistory"
              @click="loadAuditHistory"
            >
              <q-tooltip style="font-size:16px">Atualiza o histórico</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
        <q-card-section>
          <q-table
            :rows="auditLogs"
            :columns="auditLogColumns"
            row-key="id"
            flat
            dense
            :loading="loadingAuditHistory"
            :pagination="{ rowsPerPage: 15 }"
          >
            <template #body-cell-operation="props">
              <q-td :props="props">
                {{ formatAuditOperation(props.row.operation) }}
              </q-td>
            </template>
            <template #body-cell-createdAt="props">
              <q-td :props="props">
                {{ formatDate(props.row.createdAt) }}
              </q-td>
            </template>
            <template #body-cell-description="props">
              <q-td :props="props" style="max-width: 420px; white-space: normal;">
                {{ formatAuditDescription(props.row) }}
              </q-td>
            </template>
            <template #body-cell-whatsapp="props">
              <q-td :props="props">
                {{ formatAuditWhatsappStatus(props.row) }}
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  @click="handleClearOneAuditHistory(props.row)"
                >
                  <q-tooltip style="font-size:16px">Apagar este registro</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Fechar" v-close-popup>
            <q-tooltip style="font-size:16px">Fecha a janela de histórico</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="menuStore.showUsersManagementDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 1200px">
        <q-card-section>
          <div class="text-h6">Gerenciar usuários</div>
          <div class="text-subtitle2 text-grey-7">
            Apenas administradores podem cadastrar e alterar status.
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleCreateUserByAdmin">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-input v-model="createUserForm.email" type="email" label="Email" outlined />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="createUserForm.name" label="Nome" outlined />
              </div>
              <div class="col-12 col-md-4">
                <q-select v-model="createUserForm.role" :options="userRoleOptions" label="Status" outlined />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="createUserForm.password"
                  :type="showPassword.newUser ? 'text' : 'password'"
                  label="Senha do novo usuário"
                  outlined
                >
                  <template #append>
                    <q-icon
                      :name="showPassword.newUser ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="showPassword.newUser = !showPassword.newUser"
                    />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="createUserForm.confirmPassword"
                  :type="showPassword.confirmUser ? 'text' : 'password'"
                  label="Confirmar senha do novo usuário"
                  outlined
                >
                  <template #append>
                    <q-icon
                      :name="showPassword.confirmUser ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="showPassword.confirmUser = !showPassword.confirmUser"
                    />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="createUserForm.timezone" label="Timezone" outlined />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="createUserForm.whatsappPhone"
                  label="WhatsApp (internacional)"
                  hint="Ex: +5581999999999"
                  outlined
                />
              </div>
              <div class="col-12 col-md-4 flex items-center">
                <q-checkbox
                  v-model="createUserForm.whatsappOptIn"
                  label="Ativar lembretes no WhatsApp"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="createUserForm.adminPassword"
                  :type="showPassword.admin ? 'text' : 'password'"
                  label="Sua senha (admin)"
                  outlined
                >
                  <template #append>
                    <q-icon
                      :name="showPassword.admin ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="showPassword.admin = !showPassword.admin"
                    />
                  </template>
                </q-input>
              </div>
            </div>
            <div class="row justify-end q-mt-sm">
              <q-btn type="submit" color="primary" label="Cadastrar usuário" :loading="loadingCreateUser">
                <q-tooltip style="font-size:16px">Cria um novo usuário com os dados informados</q-tooltip>
              </q-btn>
            </div>
          </q-form>
        </q-card-section>

        <q-card-section>
          <q-table
            title="Usuários e status"
            :rows="adminUsers"
            :columns="adminUsersColumns"
            row-key="id"
            flat
            dense
            :loading="loadingAdminUsers"
          >
            <template #body-cell-role="props">
              <q-td :props="props">
                {{ props.row.role === 'ADMIN' ? 'Administrador' : 'Usuário' }}
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  size="sm"
                  color="primary"
                  :disable="props.row.id === authStore.user?.id"
                  :label="props.row.role === 'ADMIN' ? 'Tornar usuário' : 'Tornar admin'"
                  :loading="updatingUserId === props.row.id"
                  @click="handleToggleUserRole(props.row)"
                >
                  <q-tooltip style="font-size:16px">
                    {{
                      props.row.id === authStore.user?.id
                        ? 'Você não pode alterar seu próprio status'
                        : props.row.role === 'ADMIN'
                          ? 'Rebaixa para usuário comum'
                          : 'Promove para administrador'
                    }}
                  </q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat color="primary" label="Fechar" @click="closeUsersManagementDialog">
            <q-tooltip style="font-size:16px">Fecha a janela de gerenciamento de usuários</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAuditDeleteConfirmDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 460px">
        <q-card-section>
          <div class="text-h6">{{ auditDeleteConfirmTitle }}</div>
        </q-card-section>
        <q-card-section>
          {{ auditDeleteConfirmMessage }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            color="grey-7"
            label="Cancelar"
            :disable="auditDeleteConfirmLoading"
            @click="closeAuditDeleteConfirmDialog"
          />
          <q-btn
            color="negative"
            label="Apagar"
            :loading="auditDeleteConfirmLoading"
            @click="confirmAuditDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showItemDeleteConfirmDialog" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 460px">
        <q-card-section>
          <div class="text-h6">{{ itemDeleteConfirmTitle }}</div>
        </q-card-section>
        <q-card-section>
          {{ itemDeleteConfirmMessage }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            color="grey-7"
            label="Cancelar"
            :disable="itemDeleteConfirmLoading"
            @click="closeItemDeleteConfirmDialog"
          />
          <q-btn
            color="negative"
            label="Apagar"
            :loading="itemDeleteConfirmLoading"
            @click="confirmItemDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { useAuthStore, type AuditLogItem, type AdminUser } from 'src/stores/auth-store';
import { useAgendaStore, type Appointment, type Reminder, type ReminderPriority } from 'src/stores/agenda-store';
import { useMenuStore } from 'src/stores/menu-store';

type UserRole = 'USER' | 'ADMIN';

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => number;
      reset: (widgetId: number) => void;
      ready?: (cb: () => void) => void;
      enterprise?: {
        render: (
          element: HTMLElement,
          options: {
            sitekey: string;
            callback: (token: string) => void;
            'expired-callback'?: () => void;
            'error-callback'?: () => void;
          },
        ) => number;
        reset: (widgetId: number) => void;
        ready?: (cb: () => void) => void;
      };
    };
  }
}

const $q = useQuasar();
const authStore = useAuthStore();
const agendaStore = useAgendaStore();
const menuStore = useMenuStore();
const recaptchaSiteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
const hasRecaptchaKey = Boolean(recaptchaSiteKey);
const captchaContainerRef = ref<HTMLElement | null>(null);
const captchaToken = ref('');
const captchaWidgetId = ref<number | null>(null);
const captchaLoadError = ref('');
let recaptchaScriptPromise: Promise<void> | null = null;
const recaptchaScriptUrls = [
  'https://www.google.com/recaptcha/api.js?render=explicit',
  'https://www.recaptcha.net/recaptcha/api.js?render=explicit',
];

const authTab = ref<'login' | 'register'>('login');
const loadingAuth = ref(false);
const loadingRegister = ref(false);
const agendaView = ref<'both' | 'reminders' | 'appointments'>('both');
const showLoginPassword = ref(false);
const showRegisterPassword = ref(false);
const showRegisterConfirmPassword = ref(false);
const showForgotPasswordDialog = ref(false);
const forgotPasswordEmail = ref('');
const loadingForgotPassword = ref(false);
const showReminderFormDialog = ref(false);
const showAppointmentFormDialog = ref(false);
const loadingWhatsappSettings = ref(false);
const showReminderDetailsDialog = ref(false);
const showAppointmentDetailsDialog = ref(false);
const loadingAuditHistory = ref(false);
const showAuditDeleteConfirmDialog = ref(false);
const auditDeleteConfirmLoading = ref(false);
const auditDeleteConfirmTitle = ref('');
const auditDeleteConfirmMessage = ref('');
const auditDeleteMode = ref<'all' | 'one'>('all');
const auditDeleteTargetId = ref('');
const showItemDeleteConfirmDialog = ref(false);
const itemDeleteConfirmLoading = ref(false);
const itemDeleteConfirmTitle = ref('');
const itemDeleteConfirmMessage = ref('');
const itemDeleteType = ref<'reminder' | 'appointment'>('reminder');
const itemDeleteTargetId = ref('');
const selectedReminder = ref<Reminder | null>(null);
const selectedAppointment = ref<Appointment | null>(null);
const auditLogs = ref<AuditLogItem[]>([]);
const loadingChangePassword = ref(false);
const loadingAdminUsers = ref(false);
const loadingCreateUser = ref(false);
const updatingUserId = ref('');

const loginForm = reactive({
  email: '',
  password: '',
});

const registerForm = reactive({
  name: '',
  email: '',
  whatsappPhone: '',
  password: '',
  confirmPassword: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Recife',
});

const reminderForm = reactive({
  id: '',
  title: '',
  notes: '',
  remindAt: '',
  priority: 'MEDIUM' as ReminderPriority,
});

const appointmentForm = reactive({
  id: '',
  title: '',
  startsAt: '',
  location: '',
  notes: '',
});

const changePasswordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

const whatsappSettingsForm = reactive({
  whatsappPhone: '',
  whatsappOptIn: false,
});

const createUserForm = reactive({
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
  timezone: 'America/Recife',
  role: 'USER' as UserRole,
  whatsappPhone: '',
  whatsappOptIn: false,
  adminPassword: '',
});

const showPassword = reactive({
  current: false,
  new: false,
  confirm: false,
  newUser: false,
  confirmUser: false,
  admin: false,
});

const adminUsers = ref<AdminUser[]>([]);
const userRoleOptions: UserRole[] = ['USER', 'ADMIN'];
const adminUsersColumns: Array<{ name: string; label: string; field: string; align?: 'left' | 'right' | 'center' }> = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'role', label: 'Status', field: 'role', align: 'left' },
  { name: 'timezone', label: 'Timezone', field: 'timezone', align: 'left' },
  { name: 'actions', label: 'Ações', field: 'actions', align: 'right' },
];

const priorityOptions: ReminderPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const auditLogColumns: Array<{ name: string; label: string; field: string; align?: 'left' | 'right' | 'center' }> = [
  { name: 'createdAt', label: 'Data/Hora', field: 'createdAt', align: 'left' },
  { name: 'operation', label: 'Operação', field: 'operation', align: 'left' },
  { name: 'entity', label: 'Entidade', field: 'entity', align: 'left' },
  { name: 'whatsapp', label: 'WhatsApp', field: 'whatsapp', align: 'left' },
  { name: 'description', label: 'Descrição', field: 'description', align: 'left' },
  { name: 'actions', label: 'Ações', field: 'actions', align: 'right' },
];

onMounted(async () => {
  await authStore.restoreSession();
  if (authStore.isAuthenticated) {
    await safeLoadAgenda();
    return;
  }

  if (authTab.value === 'login') {
    await initRecaptcha();
  }
});

async function handleLogin() {
  if (hasRecaptchaKey) {
    if (!captchaToken.value) {
      notifyError('Confirme o CAPTCHA antes de entrar.');
      return;
    }
  }

  loadingAuth.value = true;
  try {
    await authStore.login(loginForm.email, loginForm.password, captchaToken.value || undefined);
    await safeLoadAgenda();
    notifySuccess('Login realizado.');
  } catch (error) {
    notifyError(error);
    resetRecaptcha();
  } finally {
    loadingAuth.value = false;
  }
}

async function handleRegister() {
  const email = registerForm.email.trim().toLowerCase();
  const name = registerForm.name.trim();
  const timezone = registerForm.timezone.trim() || 'America/Recife';
  const whatsappPhone = registerForm.whatsappPhone.trim();
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  if (!email) {
    notifyError('Informe o e-mail.');
    return;
  }
  if (!whatsappPhone) {
    notifyError('Informe o WhatsApp para receber lembretes e compromissos.');
    return;
  }
  if (!phoneRegex.test(whatsappPhone)) {
    notifyError('WhatsApp inválido. Use o formato internacional, ex: +5581999999999.');
    return;
  }
  if (!registerForm.password || registerForm.password.length < 6) {
    notifyError('A senha deve ter pelo menos 6 caracteres.');
    return;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    notifyError('A confirmação de senha não confere.');
    return;
  }

  loadingRegister.value = true;
  try {
    const payload: {
      email: string;
      password: string;
      name?: string;
      timezone?: string;
      whatsappPhone?: string;
      whatsappOptIn?: boolean;
    } = {
      email,
      password: registerForm.password,
      timezone,
      whatsappPhone,
      whatsappOptIn: true,
    };
    if (name) {
      payload.name = name;
    }
    await authStore.register(payload);

    await safeLoadAgenda();
    notifySuccess('Cadastro realizado com sucesso.');
    resetRegisterForm();
    showRegisterPassword.value = false;
    showRegisterConfirmPassword.value = false;
  } catch (error) {
    notifyError(error);
  } finally {
    loadingRegister.value = false;
  }
}

function openForgotPasswordDialog() {
  forgotPasswordEmail.value = loginForm.email.trim().toLowerCase();
  showForgotPasswordDialog.value = true;
}

function closeForgotPasswordDialog() {
  showForgotPasswordDialog.value = false;
  loadingForgotPassword.value = false;
}

async function handleForgotPassword() {
  const email = forgotPasswordEmail.value.trim().toLowerCase();
  if (!email) {
    notifyError('Informe o e-mail.');
    return;
  }

  loadingForgotPassword.value = true;
  try {
    const response = await authStore.forgotPassword(email);
    notifySuccess(response.message || 'Se o e-mail existir, você receberá instruções.');
    closeForgotPasswordDialog();
  } catch (error) {
    notifyError(error);
    loadingForgotPassword.value = false;
  }
}

function closeChangePasswordDialog() {
  menuStore.closeChangePassword();
  changePasswordForm.currentPassword = '';
  changePasswordForm.newPassword = '';
  changePasswordForm.confirmNewPassword = '';
  showPassword.current = false;
  showPassword.new = false;
  showPassword.confirm = false;
}

function closeWhatsappSettingsDialog() {
  menuStore.closeWhatsappSettings();
  whatsappSettingsForm.whatsappPhone = '';
  whatsappSettingsForm.whatsappOptIn = false;
}

function openCreateReminderDialog() {
  resetReminderForm();
  showReminderFormDialog.value = true;
}

function closeReminderFormDialog() {
  showReminderFormDialog.value = false;
  resetReminderForm();
}

function openCreateAppointmentDialog() {
  resetAppointmentForm();
  showAppointmentFormDialog.value = true;
}

function closeAppointmentFormDialog() {
  showAppointmentFormDialog.value = false;
  resetAppointmentForm();
}

async function handleChangePassword() {
  if (changePasswordForm.newPassword.length < 6) {
    notifyError('A nova senha deve ter pelo menos 6 caracteres.');
    return;
  }

  if (changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword) {
    notifyError('A confirmação da nova senha não confere.');
    return;
  }

  loadingChangePassword.value = true;
  try {
    await authStore.changePassword({
      currentPassword: changePasswordForm.currentPassword,
      newPassword: changePasswordForm.newPassword,
    });
    notifySuccess('Senha alterada com sucesso.');
    closeChangePasswordDialog();
  } catch (error) {
    notifyError(error);
  } finally {
    loadingChangePassword.value = false;
  }
}

async function handleSaveWhatsappSettings() {
  const phone = whatsappSettingsForm.whatsappPhone.trim();
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  if (whatsappSettingsForm.whatsappOptIn && !phone) {
    notifyError('Informe o telefone para ativar lembretes no WhatsApp.');
    return;
  }

  if (phone && !phoneRegex.test(phone)) {
    notifyError('Telefone inválido. Use o formato internacional, ex: +5581999999999.');
    return;
  }

  loadingWhatsappSettings.value = true;
  try {
    const payload: { whatsappOptIn: boolean; whatsappPhone?: string } = {
      whatsappOptIn: whatsappSettingsForm.whatsappOptIn,
    };
    if (phone) {
      payload.whatsappPhone = phone;
    }

    await authStore.updateWhatsappSettings(payload);
    notifySuccess('Configurações de WhatsApp salvas.');
    closeWhatsappSettingsDialog();
  } catch (error) {
    notifyError(error);
  } finally {
    loadingWhatsappSettings.value = false;
  }
}

async function loadAuditHistory() {
  loadingAuditHistory.value = true;
  try {
    const result = await authStore.listMyAuditLogs();
    auditLogs.value = result.logs || [];
  } catch (error) {
    notifyError(error);
  } finally {
    loadingAuditHistory.value = false;
  }
}

function handleClearAuditHistory() {
  auditDeleteMode.value = 'all';
  auditDeleteTargetId.value = '';
  auditDeleteConfirmTitle.value = 'Apagar histórico';
  auditDeleteConfirmMessage.value = 'Deseja apagar todo o seu histórico? Esta ação não pode ser desfeita.';
  showAuditDeleteConfirmDialog.value = true;
}

function handleClearOneAuditHistory(log: AuditLogItem) {
  auditDeleteMode.value = 'one';
  auditDeleteTargetId.value = log.id;
  auditDeleteConfirmTitle.value = 'Apagar registro';
  auditDeleteConfirmMessage.value = 'Deseja apagar este registro do histórico?';
  showAuditDeleteConfirmDialog.value = true;
}

function closeAuditDeleteConfirmDialog() {
  showAuditDeleteConfirmDialog.value = false;
  auditDeleteConfirmLoading.value = false;
  auditDeleteTargetId.value = '';
}

async function confirmAuditDelete() {
  if (auditDeleteConfirmLoading.value) return;
  auditDeleteConfirmLoading.value = true;
  if (auditDeleteMode.value === 'all') {
    await clearAuditHistoryConfirmed();
    return;
  }

  await clearOneAuditHistoryConfirmed(auditDeleteTargetId.value);
}

async function clearAuditHistoryConfirmed() {
  loadingAuditHistory.value = true;
  try {
    const result = await authStore.clearMyAuditLogs();
    auditLogs.value = [];
    notifySuccess(`Histórico apagado (${result.deletedCount} registros).`);
    closeAuditDeleteConfirmDialog();
  } catch (error) {
    notifyError(error);
    auditDeleteConfirmLoading.value = false;
  } finally {
    loadingAuditHistory.value = false;
  }
}

async function clearOneAuditHistoryConfirmed(logId: string) {
  loadingAuditHistory.value = true;
  try {
    await authStore.clearMyAuditLogById(logId);
    auditLogs.value = auditLogs.value.filter((item) => item.id !== logId);
    notifySuccess('Registro de histórico apagado.');
    closeAuditDeleteConfirmDialog();
  } catch (error) {
    notifyError(error);
    auditDeleteConfirmLoading.value = false;
  } finally {
    loadingAuditHistory.value = false;
  }
}

async function handleSaveReminder() {
  try {
    if (reminderForm.id) {
      const payload: {
        title: string;
        remindAt: string;
        priority: ReminderPriority;
        notes?: string;
      } = {
        title: reminderForm.title,
        remindAt: reminderForm.remindAt,
        priority: reminderForm.priority,
      };
      if (reminderForm.notes) payload.notes = reminderForm.notes;

      await agendaStore.updateReminder(reminderForm.id, payload);
      notifySuccess('Lembrete atualizado.');
    } else {
      const payload: {
        title: string;
        remindAt: string;
        priority: ReminderPriority;
        notes?: string;
      } = {
        title: reminderForm.title,
        remindAt: reminderForm.remindAt,
        priority: reminderForm.priority,
      };
      if (reminderForm.notes) payload.notes = reminderForm.notes;

      await agendaStore.createReminder(payload);
      notifySuccess('Lembrete criado.');
    }
    resetReminderForm();
    showReminderFormDialog.value = false;
  } catch (error) {
    notifyError(error);
  }
}

async function handleSaveAppointment() {
  try {
    if (appointmentForm.id) {
      const payload: {
        title: string;
        startsAt: string;
        location?: string;
        notes?: string;
      } = {
        title: appointmentForm.title,
        startsAt: appointmentForm.startsAt,
      };
      if (appointmentForm.location) payload.location = appointmentForm.location;
      if (appointmentForm.notes) payload.notes = appointmentForm.notes;

      await agendaStore.updateAppointment(appointmentForm.id, payload);
      notifySuccess('Compromisso atualizado.');
    } else {
      const payload: {
        title: string;
        startsAt: string;
        location?: string;
        notes?: string;
      } = {
        title: appointmentForm.title,
        startsAt: appointmentForm.startsAt,
      };
      if (appointmentForm.location) payload.location = appointmentForm.location;
      if (appointmentForm.notes) payload.notes = appointmentForm.notes;

      await agendaStore.createAppointment(payload);
      notifySuccess('Compromisso criado.');
    }
    resetAppointmentForm();
    showAppointmentFormDialog.value = false;
  } catch (error) {
    notifyError(error);
  }
}

function editReminder(id: string) {
  const item = agendaStore.reminders.find((current) => current.id === id);
  if (!item) return;

  reminderForm.id = item.id;
  reminderForm.title = item.title;
  reminderForm.notes = item.notes || '';
  reminderForm.remindAt = toLocalDateTimeInput(item.remindAt);
  reminderForm.priority = item.priority;
  showReminderFormDialog.value = true;
}

function editAppointment(id: string) {
  const item = agendaStore.appointments.find((current) => current.id === id);
  if (!item) return;

  appointmentForm.id = item.id;
  appointmentForm.title = item.title;
  appointmentForm.startsAt = toLocalDateTimeInput(item.startsAt);
  appointmentForm.location = item.location || '';
  appointmentForm.notes = item.notes || '';
  showAppointmentFormDialog.value = true;
}

function viewReminder(id: string) {
  const item = agendaStore.reminders.find((current) => current.id === id);
  if (!item) return;
  selectedReminder.value = item;
  showReminderDetailsDialog.value = true;
}

function viewAppointment(id: string) {
  const item = agendaStore.appointments.find((current) => current.id === id);
  if (!item) return;
  selectedAppointment.value = item;
  showAppointmentDetailsDialog.value = true;
}

function removeReminder(id: string) {
  itemDeleteType.value = 'reminder';
  itemDeleteTargetId.value = id;
  itemDeleteConfirmTitle.value = 'Excluir lembrete';
  itemDeleteConfirmMessage.value = 'Deseja excluir este lembrete? Esta ação não pode ser desfeita.';
  showItemDeleteConfirmDialog.value = true;
}

function removeAppointment(id: string) {
  itemDeleteType.value = 'appointment';
  itemDeleteTargetId.value = id;
  itemDeleteConfirmTitle.value = 'Excluir compromisso';
  itemDeleteConfirmMessage.value = 'Deseja excluir este compromisso? Esta ação não pode ser desfeita.';
  showItemDeleteConfirmDialog.value = true;
}

function resetReminderForm() {
  reminderForm.id = '';
  reminderForm.title = '';
  reminderForm.notes = '';
  reminderForm.remindAt = '';
  reminderForm.priority = 'MEDIUM';
}

function resetAppointmentForm() {
  appointmentForm.id = '';
  appointmentForm.title = '';
  appointmentForm.startsAt = '';
  appointmentForm.location = '';
  appointmentForm.notes = '';
}

function resetRegisterForm() {
  registerForm.name = '';
  registerForm.email = '';
  registerForm.whatsappPhone = '';
  registerForm.password = '';
  registerForm.confirmPassword = '';
  registerForm.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Recife';
}

function closeItemDeleteConfirmDialog() {
  showItemDeleteConfirmDialog.value = false;
  itemDeleteConfirmLoading.value = false;
  itemDeleteTargetId.value = '';
}

async function confirmItemDelete() {
  if (itemDeleteConfirmLoading.value || !itemDeleteTargetId.value) return;

  itemDeleteConfirmLoading.value = true;
  try {
    if (itemDeleteType.value === 'reminder') {
      await agendaStore.deleteReminder(itemDeleteTargetId.value);
      if (reminderForm.id === itemDeleteTargetId.value) resetReminderForm();
      notifySuccess('Lembrete removido.');
    } else {
      await agendaStore.deleteAppointment(itemDeleteTargetId.value);
      if (appointmentForm.id === itemDeleteTargetId.value) resetAppointmentForm();
      notifySuccess('Compromisso removido.');
    }
    closeItemDeleteConfirmDialog();
  } catch (error) {
    notifyError(error);
    itemDeleteConfirmLoading.value = false;
  }
}

async function safeLoadAgenda() {
  try {
    await agendaStore.loadAgenda();
  } catch (error) {
    notifyError(error);
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR');
}

function isReminderOverdue(item: Reminder) {
  return !item.done && new Date(item.remindAt).getTime() < Date.now();
}

function isAppointmentOverdue(item: Appointment) {
  return !item.done && new Date(item.startsAt).getTime() < Date.now();
}

function formatAuditOperation(operation: string) {
  const labels: Record<string, string> = {
    CREATE: 'Cadastro',
    UPDATE: 'Alteração',
    DELETE: 'Exclusão',
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    PASSWORD_CHANGE: 'Alteração de senha',
    ROLE_CHANGE: 'Alteração de status',
  };
  return labels[operation] || operation;
}

function formatAuditDescription(log: AuditLogItem) {
  const baseDescription = log.description || '-';
  if (baseDescription.includes('Campos alterados:')) {
    return baseDescription;
  }
  const metadata = log.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return baseDescription;
  }

  const changedFieldsRaw = metadata.changedFields;
  const beforeRaw = metadata.before;
  const afterRaw = metadata.after;

  if (!Array.isArray(changedFieldsRaw) || changedFieldsRaw.length === 0) {
    return baseDescription;
  }

  const before = (beforeRaw && typeof beforeRaw === 'object')
    ? (beforeRaw as Record<string, unknown>)
    : {};
  const after = (afterRaw && typeof afterRaw === 'object')
    ? (afterRaw as Record<string, unknown>)
    : {};

  const details = changedFieldsRaw
    .map((field) => {
      const fieldName = String(field);
      const oldValue = stringifyAuditValue(before[fieldName]);
      const newValue = stringifyAuditValue(after[fieldName]);
      return `${fieldName}: ${oldValue} -> ${newValue}`;
    })
    .join('; ');

  return `${baseDescription} Campos alterados: ${details}.`;
}

function stringifyAuditValue(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function formatAuditWhatsappStatus(log: AuditLogItem) {
  if (log.operation === 'WHATSAPP_SENT') {
    return `Enviado em ${formatDate(log.createdAt)}`;
  }

  if (log.operation === 'WHATSAPP_ERROR') {
    return `Falha em ${formatDate(log.createdAt)}`;
  }

  return '-';
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function notifySuccess(message: string) {
  $q.notify({ type: 'positive', message });
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
        message: 'Credenciais inválidas. Verifique seu e-mail e senha.'
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

    if (status === 429) {
      $q.notify({
        type: 'negative',
        message: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
      });
      return;
    }

    if (status === 400) {
      // For bad requests, show the backend message if available
      const message = typeof backendMessage === 'string'
        ? backendMessage
        : Array.isArray(backendMessage) && backendMessage.length > 0
          ? String(backendMessage[0])
          : backendError || 'Requisição inválida. Verifique os dados informados.';
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
        : backendError || 'Erro ao comunicar com o servidor.';
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

watch(authTab, (tab) => {
  showLoginPassword.value = false;
  if (tab === 'login') {
    captchaLoadError.value = '';
    void initRecaptcha();
    return;
  }

  captchaToken.value = '';
  captchaWidgetId.value = null;
  showRegisterPassword.value = false;
  showRegisterConfirmPassword.value = false;
});

watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      captchaToken.value = '';
      captchaWidgetId.value = null;
      return;
    }

    captchaLoadError.value = '';
    captchaToken.value = '';
    captchaWidgetId.value = null;
    await nextTick();
    void initRecaptcha();
  },
);

async function initRecaptcha() {
  if (!hasRecaptchaKey) {
    return;
  }

  try {
    await ensureRecaptchaScriptLoaded();
    await nextTick();
    await waitForRecaptchaApi();

    const recaptchaApi = getRecaptchaApi();

    if (!captchaContainerRef.value || !recaptchaApi || captchaWidgetId.value !== null) {
      return;
    }

    if (recaptchaApi.ready) {
      await new Promise<void>((resolve) => recaptchaApi.ready!(resolve));
    }

    captchaWidgetId.value = recaptchaApi.render(captchaContainerRef.value, {
      sitekey: recaptchaSiteKey,
      callback: (token: string) => {
        captchaToken.value = token;
      },
      'expired-callback': () => {
        captchaToken.value = '';
      },
      'error-callback': () => {
        captchaToken.value = '';
      },
    });
  } catch (error) {
    captchaLoadError.value = error instanceof Error
      ? error.message
      : 'Não foi possível carregar o CAPTCHA. Verifique bloqueador de anúncios, DNS ou firewall.';
    notifyError('Não foi possível carregar o CAPTCHA.');
  }
}

async function ensureRecaptchaScriptLoaded() {
  if (getRecaptchaApi()) {
    return;
  }

  if (recaptchaScriptPromise) {
    return recaptchaScriptPromise;
  }

  recaptchaScriptPromise = (async () => {
    clearRecaptchaScripts();

    const failedUrls: string[] = [];
    for (const scriptUrl of recaptchaScriptUrls) {
      try {
        await loadRecaptchaScript(scriptUrl);
        await waitForRecaptchaApi();
        if (getRecaptchaApi()) {
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('recaptcha-load-error:')) {
          failedUrls.push(error.message.replace('recaptcha-load-error:', ''));
        } else {
          failedUrls.push(scriptUrl);
        }
      }
    }

    throw new Error(
      `Não foi possível carregar o CAPTCHA. Falhou em: ${failedUrls.join(', ')}.`,
    );
  })();

  return recaptchaScriptPromise;
}

function loadRecaptchaScript(url: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`recaptcha-load-error:${url}`));
    };
    document.head.appendChild(script);
  });
}

function clearRecaptchaScripts() {
  document
    .querySelectorAll<HTMLScriptElement>('script[data-recaptcha-script="true"]')
    .forEach((script) => script.remove());
}

function resetRecaptcha() {
  const recaptchaApi = getRecaptchaApi();
  if (captchaWidgetId.value === null || !recaptchaApi) {
    captchaToken.value = '';
    return;
  }

  recaptchaApi.reset(captchaWidgetId.value);
  captchaToken.value = '';
}

function getRecaptchaApi() {
  if (!window.grecaptcha) {
    return null;
  }

  if (
    typeof window.grecaptcha.render === 'function'
    && typeof window.grecaptcha.reset === 'function'
  ) {
    return {
      render: window.grecaptcha.render.bind(window.grecaptcha),
      reset: window.grecaptcha.reset.bind(window.grecaptcha),
      ready: window.grecaptcha.ready?.bind(window.grecaptcha),
    };
  }

  if (
    window.grecaptcha.enterprise
    && typeof window.grecaptcha.enterprise.render === 'function'
    && typeof window.grecaptcha.enterprise.reset === 'function'
  ) {
    return {
      render: window.grecaptcha.enterprise.render.bind(window.grecaptcha.enterprise),
      reset: window.grecaptcha.enterprise.reset.bind(window.grecaptcha.enterprise),
      ready: window.grecaptcha.enterprise.ready?.bind(window.grecaptcha.enterprise),
    };
  }

  return null;
}

async function waitForRecaptchaApi() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 4000) {
    if (getRecaptchaApi()) {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
}

function closeUsersManagementDialog() {
  menuStore.closeUsersManagement();
  createUserForm.email = '';
  createUserForm.name = '';
  createUserForm.password = '';
  createUserForm.confirmPassword = '';
  createUserForm.timezone = 'America/Recife';
  createUserForm.role = 'USER';
  createUserForm.whatsappPhone = '';
  createUserForm.whatsappOptIn = false;
  createUserForm.adminPassword = '';
  showPassword.newUser = false;
  showPassword.confirmUser = false;
  showPassword.admin = false;
  adminUsers.value = [];
}

async function handleCreateUserByAdmin() {
  const email = createUserForm.email.trim().toLowerCase();
  const name = createUserForm.name.trim();
  const timezone = createUserForm.timezone.trim() || 'America/Recife';
  const whatsappPhone = createUserForm.whatsappPhone.trim();
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  if (!email) {
    notifyError('Informe o e-mail do novo usuário.');
    return;
  }
  if (!createUserForm.password || createUserForm.password.length < 6) {
    notifyError('A senha do novo usuário deve ter pelo menos 6 caracteres.');
    return;
  }
  if (createUserForm.password !== createUserForm.confirmPassword) {
    notifyError('A confirmação de senha do novo usuário não confere.');
    return;
  }
  if (whatsappPhone && !phoneRegex.test(whatsappPhone)) {
    notifyError('WhatsApp inválido. Use o formato internacional, ex: +5581999999999.');
    return;
  }
  if (!createUserForm.adminPassword) {
    notifyError('Informe sua senha de administrador para confirmar a operação.');
    return;
  }

  loadingCreateUser.value = true;
  try {
    const payload: {
      email: string;
      password: string;
      name?: string;
      timezone?: string;
      role?: UserRole;
      whatsappPhone?: string;
      whatsappOptIn?: boolean;
      adminPassword: string;
    } = {
      email,
      password: createUserForm.password,
      timezone,
      role: createUserForm.role,
      adminPassword: createUserForm.adminPassword,
    };
    if (name) {
      payload.name = name;
    }
    if (whatsappPhone) {
      payload.whatsappPhone = whatsappPhone;
      payload.whatsappOptIn = createUserForm.whatsappOptIn;
    }

    await authStore.createUserByAdmin(payload);
    notifySuccess('Usuário criado com sucesso.');

    // Reset form
    createUserForm.email = '';
    createUserForm.name = '';
    createUserForm.password = '';
    createUserForm.confirmPassword = '';
    createUserForm.timezone = 'America/Recife';
    createUserForm.role = 'USER';
    createUserForm.whatsappPhone = '';
    createUserForm.whatsappOptIn = false;
    createUserForm.adminPassword = '';
    showPassword.newUser = false;
    showPassword.confirmUser = false;
    showPassword.admin = false;

    // Reload users list
    await loadAdminUsers();
  } catch (error) {
    notifyError(error);
  } finally {
    loadingCreateUser.value = false;
  }
}

async function loadAdminUsers() {
  loadingAdminUsers.value = true;
  try {
    const result = await authStore.listUsers();
    adminUsers.value = result.users || [];
  } catch (error) {
    notifyError(error);
  } finally {
    loadingAdminUsers.value = false;
  }
}

async function handleToggleUserRole(user: AdminUser) {
  if (user.id === authStore.user?.id) {
    notifyError('Você não pode alterar seu próprio status.');
    return;
  }

  updatingUserId.value = user.id;
  try {
    const newRole: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    await authStore.updateUserRoleByAdmin(user.id, newRole);
    notifySuccess(`Status do usuário alterado para ${newRole === 'ADMIN' ? 'administrador' : 'usuário'}.`);

    // Update local list
    const index = adminUsers.value.findIndex(u => u.id === user.id);
    if (index !== -1) {
      const userToUpdate = adminUsers.value[index]!;
      const updatedUser: AdminUser = {
        id: userToUpdate.id,
        email: userToUpdate.email,
        name: userToUpdate.name,
        role: newRole,
        timezone: userToUpdate.timezone,
        whatsappPhone: userToUpdate.whatsappPhone,
        whatsappOptIn: userToUpdate.whatsappOptIn,
        createdAt: userToUpdate.createdAt
      };
      adminUsers.value.splice(index, 1, updatedUser);
    }
  } catch (error) {
    notifyError(error);
  } finally {
    updatingUserId.value = '';
  }
}

// Watch for dialog opening to load users
watch(
  () => menuStore.showUsersManagementDialog,
  async (show) => {
    if (show) {
      await loadAdminUsers();
    }
  }
);
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
}

.auth-wrapper {
  max-width: 500px;
  margin: 40px auto;
}

.agenda-wrapper {
  max-width: 1100px;
  margin: 0 auto;
}

.item-overdue {
  background: #fff3f3;
  border-left: 4px solid #c10015;
}
</style>
