import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export type ReminderPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Reminder = {
  id: string;
  title: string;
  notes: string | null;
  remindAt: string;
  done: boolean;
  priority: ReminderPriority;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  title: string;
  location: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export const useAgendaStore = defineStore('agenda', {
  state: () => ({
    reminders: [] as Reminder[],
    appointments: [] as Appointment[],
  }),
  actions: {
    async loadAgenda() {
      const [remindersRes, appointmentsRes] = await Promise.all([
        api.get<Reminder[]>('/reminders'),
        api.get<Appointment[]>('/appointments'),
      ]);
      this.reminders = remindersRes.data;
      this.appointments = appointmentsRes.data;
    },
    async createReminder(payload: {
      title: string;
      remindAt: string;
      notes?: string;
      priority?: ReminderPriority;
    }) {
      await api.post('/reminders', payload);
      await this.loadAgenda();
    },
    async updateReminder(
      id: string,
      payload: Partial<{
        title: string;
        notes: string;
        remindAt: string;
        priority: ReminderPriority;
        done: boolean;
      }>,
    ) {
      await api.patch(`/reminders/${id}`, payload);
      await this.loadAgenda();
    },
    async deleteReminder(id: string) {
      await api.delete(`/reminders/${id}`);
      this.reminders = this.reminders.filter((item) => item.id !== id);
    },
    async createAppointment(payload: {
      title: string;
      startsAt: string;
      endsAt?: string;
      location?: string;
      notes?: string;
    }) {
      await api.post('/appointments', payload);
      await this.loadAgenda();
    },
    async updateAppointment(
      id: string,
      payload: Partial<{
        title: string;
        location: string;
        notes: string;
        startsAt: string;
        endsAt: string;
        done: boolean;
      }>,
    ) {
      await api.patch(`/appointments/${id}`, payload);
      await this.loadAgenda();
    },
    async deleteAppointment(id: string) {
      await api.delete(`/appointments/${id}`);
      this.appointments = this.appointments.filter((item) => item.id !== id);
    },
  },
});
