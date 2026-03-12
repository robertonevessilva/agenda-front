import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { AxiosError } from 'axios';

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  whatsappPhone: string | null;
  whatsappOptIn: boolean;
};

type AuthResponse = {
  user: AuthUser;
};

export type UserRole = 'ADMIN' | 'USER';

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  timezone: string;
  whatsappPhone: string | null;
  whatsappOptIn: boolean;
  createdAt: string;
};

export type AuditLogItem = {
  id: string;
  operation: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  actorUserId: string;
  targetUserId: string | null;
  createdAt: string;
};

interface ApiErrorResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async restoreSession() {
      try {
        const { data } = await api.get<{ user: AuthUser }>('/auth/me');
        this.user = data.user;
        return { success: true, user: data.user };
      } catch (error) {
        this.user = null;
        const axiosError = error as AxiosError;
        return {
          success: false,
          error: axiosError.response?.data || 'Falha ao restaurar sessão'
        };
      }
    },
    async login(email: string, password: string, captchaToken?: string) {
      try {
        const payload: { email: string; password: string; captchaToken?: string } = { email, password };
        if (captchaToken) {
          payload.captchaToken = captchaToken;
        }
        const { data } = await api.post<AuthResponse>('/auth/login', payload);
        this.user = data.user;
        return { success: true, user: data.user };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha no login. Verifique suas credenciais.'
        );
      }
    },
    async register(payload: {
      email: string;
      password: string;
      name?: string;
      timezone?: string;
      whatsappPhone?: string;
      whatsappOptIn?: boolean;
    }) {
      try {
        // Validação básica
        if (!payload.email || !payload.password) {
          throw new Error('Email e senha são obrigatórios');
        }
        if (payload.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        const { data } = await api.post<AuthResponse>('/auth/register', payload);
        this.user = data.user;
        return { success: true, user: data.user };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha no cadastro. Tente novamente.'
        );
      }
    },
    async forgotPassword(email: string) {
      try {
        if (!email) {
          throw new Error('Email é obrigatório');
        }
        const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
        return { success: true, message: data.message };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao solicitar recuperação de senha.'
        );
      }
    },
    async resetPassword(payload: { token: string; newPassword: string }) {
      try {
        if (!payload.token || !payload.newPassword) {
          throw new Error('Token e nova senha são obrigatórios');
        }
        if (payload.newPassword.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }

        const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
        return { success: true, message: data.message };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao redefinir senha.'
        );
      }
    },
    async changePassword(payload: { currentPassword: string; newPassword: string }) {
      try {
        if (!payload.currentPassword || !payload.newPassword) {
          throw new Error('Senha atual e nova senha são obrigatórias');
        }
        if (payload.newPassword.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }

        await api.post('/auth/change-password', payload);
        return { success: true };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao alterar senha.'
        );
      }
    },
    async listUsers() {
      try {
        const { data } = await api.get<AdminUser[]>('/auth/users');
        return { success: true, users: data };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao listar usuários.'
        );
      }
    },
    async createUserByAdmin(payload: {
      email: string;
      password: string;
      adminPassword: string;
      name?: string;
      timezone?: string;
      role?: UserRole;
      whatsappPhone?: string;
      whatsappOptIn?: boolean;
    }) {
      try {
        if (!payload.email || !payload.password || !payload.adminPassword) {
          throw new Error('Email, senha e senha de administrador são obrigatórios');
        }
        if (payload.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        await api.post('/auth/users', payload);
        return { success: true };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao criar usuário.'
        );
      }
    },
    async updateUserRoleByAdmin(userId: string, role: UserRole) {
      try {
        if (!userId || !role) {
          throw new Error('ID do usuário e papel são obrigatórios');
        }

        await api.patch(`/auth/users/${userId}/role`, { role });
        return { success: true };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao atualizar papel do usuário.'
        );
      }
    },
    async listMyAuditLogs() {
      try {
        const { data } = await api.get<AuditLogItem[]>('/audit/me');
        return { success: true, logs: data };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao carregar histórico.'
        );
      }
    },
    async clearMyAuditLogs() {
      try {
        const { data } = await api.delete<{ deletedCount: number }>('/audit/me');
        return { success: true, deletedCount: data.deletedCount };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao limpar histórico.'
        );
      }
    },
    async clearMyAuditLogById(logId: string) {
      try {
        if (!logId) {
          throw new Error('ID do registro é obrigatório');
        }

        const { data } = await api.delete<{ deleted: boolean }>(`/audit/me/${logId}`);
        return { success: true, deleted: data.deleted };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao excluir registro do histórico.'
        );
      }
    },
    async updateWhatsappSettings(payload: { whatsappPhone?: string; whatsappOptIn?: boolean }) {
      try {
        const { data } = await api.post<{ user: AuthUser }>('/auth/whatsapp-settings', payload);
        this.user = data.user;
        return { success: true, user: data.user };
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorData = axiosError.response?.data;
        throw new Error(
          errorData?.message ||
          errorData?.error ||
          'Falha ao atualizar configurações do WhatsApp.'
        );
      }
    },
    async logout() {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // ignore API errors and clear local auth state anyway
        console.warn('Erro ao fazer logout na API:', error);
      } finally {
        this.user = null;
      }
    },
  },
});
