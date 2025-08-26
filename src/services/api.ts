import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Configuração base do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos TypeScript
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'supervisor' | 'engineer' | 'operator' | 'viewer';
  sector: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  equipmentCount: number;
  averageProgress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: number;
  equipmentTag: string;
  name: string;
  areaId: number;
  areaName: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  isParent: boolean;
  hierarchyLevel: number;
  parentTag?: string;
  averageProgress: number;
  progressCount: number;
  createdAt: string;
  updatedAt: string;
  children?: Equipment[];
}

export interface Progress {
  equipmentId: number;
  equipmentTag: string;
  equipmentName: string;
  area: string;
  electrical: { current: number; updated: string | null; updatedBy?: string };
  mechanical: { current: number; updated: string | null; updatedBy?: string };
  civil: { current: number; updated: string | null; updatedBy?: string };
}

export interface DashboardMetrics {
  progressTotal: number;
  equipmentCount: number;
  completedTasks: number;
  activeAreas: number;
  alerts: number;
  activeTeam: number;
  lastUpdated: string;
}

export interface ProgressUpdate {
  currentProgress: number;
  observations?: string;
}

export interface StandardTask {
  id: number;
  discipline: string;
  name: string;
  description?: string;
  estimatedHours: number;
  isActive: boolean;
  sortOrder: number;
}

export interface EquipmentTask {
  id: number;
  equipmentId: number;
  standardTaskId?: number;
  discipline: string;
  name: string;
  description?: string;
  currentProgress: number;
  targetProgress: number;
  estimatedHours: number;
  actualHours: number;
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'normal' | 'high' | 'critical';
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  standardTaskName?: string;
}

export interface TaskHistory {
  id: number;
  action: string;
  previousProgress?: number;
  newProgress?: number;
  previousStatus?: string;
  newStatus?: string;
  observations?: string;
  photos?: string;
  createdAt: string;
  userName: string;
}

// Serviços de Autenticação
export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Serviços do Dashboard
export const dashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getUpcomingActivities: async () => {
    const response = await api.get('/dashboard/upcoming-activities');
    return response.data;
  },

  getSystemStatus: async () => {
    const response = await api.get('/dashboard/system-status');
    return response.data;
  },

  getProgressByArea: async () => {
    const response = await api.get('/dashboard/progress-by-area');
    return response.data;
  },

  getProgressByDiscipline: async () => {
    const response = await api.get('/dashboard/progress-by-discipline');
    return response.data;
  },
};

// Serviços de Áreas
export const areasService = {
  getAll: async (): Promise<Area[]> => {
    const response = await api.get('/areas');
    return response.data;
  },

  getById: async (id: number): Promise<Area> => {
    const response = await api.get(`/areas/${id}`);
    return response.data;
  },

  create: async (areaData: { name: string; description?: string; status?: string }) => {
    const response = await api.post('/areas', areaData);
    return response.data;
  },

  update: async (id: number, areaData: Partial<Area>) => {
    const response = await api.put(`/areas/${id}`, areaData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/areas/${id}`);
    return response.data;
  },
};

// Serviços de Equipamentos
export const equipmentService = {
  getAll: async (filters?: { area?: string; status?: string }): Promise<Equipment[]> => {
    const params = new URLSearchParams();
    if (filters?.area) params.append('area', filters.area);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/equipment?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Equipment> => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  getParents: async (): Promise<Equipment[]> => {
    const response = await api.get('/equipment/parents/list');
    return response.data;
  },

  getChildren: async (parentTag: string): Promise<Equipment[]> => {
    const response = await api.get(`/equipment/${parentTag}/children`);
    return response.data;
  },

  create: async (equipmentData: {
    equipmentTag: string;
    name: string;
    areaId: number;
    description?: string;
    status?: string;
    isParent?: boolean;
    parentTag?: string;
  }) => {
    const response = await api.post('/equipment', equipmentData);
    return response.data;
  },

  update: async (id: number, equipmentData: Partial<Equipment>) => {
    const response = await api.put(`/equipment/${id}`, equipmentData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  },
};

// Serviços de Progresso
export const progressService = {
  getAll: async (filters?: {
    area?: string;
    discipline?: string;
    status?: string;
  }): Promise<Progress[]> => {
    const params = new URLSearchParams();
    if (filters?.area) params.append('area', filters.area);
    if (filters?.discipline) params.append('discipline', filters.discipline);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/progress?${params.toString()}`);
    return response.data;
  },

  getById: async (equipmentId: number): Promise<Progress> => {
    const response = await api.get(`/progress/${equipmentId}`);
    return response.data;
  },

  update: async (
    equipmentId: number,
    discipline: string,
    progressData: ProgressUpdate
  ) => {
    const response = await api.put(
      `/progress/${equipmentId}/${discipline}`,
      progressData
    );
    return response.data;
  },

  getHistory: async (equipmentId: number, discipline: string) => {
    const response = await api.get(`/progress/${equipmentId}/${discipline}/history`);
    return response.data;
  },
};

// Serviços de Usuários
export const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    role?: string;
    sector?: string;
    isActive?: boolean;
  }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: Partial<User> & { password?: string }) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  toggleStatus: async (id: number) => {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  },
};

// Serviços de Tarefas
export const tasksService = {
  // Buscar tarefas padrão
  getStandardTasks: async (discipline?: string): Promise<StandardTask[]> => {
    const params = new URLSearchParams();
    if (discipline) params.append('discipline', discipline);
    const response = await api.get(`/tasks/standard?${params.toString()}`);
    return response.data;
  },

  // Buscar tarefas de um equipamento
  getEquipmentTasks: async (equipmentId: number): Promise<EquipmentTask[]> => {
    const response = await api.get(`/tasks/equipment/${equipmentId}`);
    return response.data;
  },

  // Gerar tarefas para um equipamento
  generateTasks: async (equipmentId: number, disciplines?: string[]) => {
    const response = await api.post(`/tasks/equipment/${equipmentId}/generate`, { disciplines });
    return response.data;
  },

  // Criar tarefa personalizada
  createCustomTask: async (equipmentId: number, taskData: {
    discipline: string;
    name: string;
    description?: string;
    estimatedHours?: number;
    priority?: string;
  }) => {
    const response = await api.post(`/tasks/equipment/${equipmentId}/custom`, taskData);
    return response.data;
  },

  // Atualizar progresso de uma tarefa
  updateTaskProgress: async (taskId: number, progressData: {
    currentProgress: number;
    observations?: string;
    photos?: string[];
    actualHours?: number;
  }) => {
    const response = await api.put(`/tasks/${taskId}/progress`, progressData);
    return response.data;
  },

  // Atualizar progresso de uma tarefa com fotos
  updateTaskProgressWithPhotos: async (taskId: number, formData: FormData) => {
    const response = await api.put(`/tasks/${taskId}/progress-with-photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Buscar histórico de uma tarefa
  getTaskHistory: async (taskId: number): Promise<TaskHistory[]> => {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  },

  // Deletar tarefa
  deleteTask: async (taskId: number) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};

// Serviços de Relatórios
export const reportsService = {
  // Buscar dados gerais para relatórios
  getReportData: async () => {
    const response = await api.get('/reports/data');
    return response.data;
  },

  // Relatório de progresso geral
  getProgressOverview: async () => {
    const response = await api.get('/reports/progress-overview');
    return response.data;
  },

  // Relatório por disciplina
  getByDiscipline: async () => {
    const response = await api.get('/reports/by-discipline');
    return response.data;
  },

  // Relatório por equipamento
  getByEquipment: async () => {
    const response = await api.get('/reports/by-equipment');
    return response.data;
  },

  // Relatório de produtividade por usuário
  getUserProductivity: async () => {
    const response = await api.get('/reports/user-productivity');
    return response.data;
  },

  // Relatório de tarefas vencidas
  getOverdueTasks: async () => {
    const response = await api.get('/reports/overdue-tasks');
    return response.data;
  },

  // Histórico detalhado de uma tarefa
  getTaskHistory: async (taskId: number) => {
    const response = await api.get(`/reports/task/${taskId}/history`);
    return response.data;
  },
};

// Health check
export const healthService = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
