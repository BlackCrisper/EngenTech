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
    } else if (error.response?.status >= 500) {
      // Erro do servidor
      error.message = 'Erro interno do servidor. Tente novamente em alguns instantes.';
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      error.message = 'Tempo limite excedido. Verifique sua conexão e tente novamente.';
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
  role: 'admin' | 'supervisor' | 'engineer' | 'operator' | 'viewer' | 'sesmt';
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
  primaryDiscipline?: 'electrical' | 'mechanical' | 'civil'; // Nova propriedade
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
  childEquipmentCount: number;
  lastUpdated: string;
  // Propriedades adicionais usadas no dashboard
  recentUpdates: number;
  activeEquipment: number;
  maintenanceEquipment: number;
  totalTasks: number;
  totalAreas: number;
  completedAreas: number;
  overdueTasks: number;
  lowProgressTasks: number;
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
  photos?: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  userName?: string;
  updatedBy?: string;
  historyId?: number;
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



  getProgressByArea: async () => {
    const response = await api.get('/dashboard/progress-by-area');
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

  getByArea: async (areaId: number): Promise<Progress[]> => {
    const response = await api.get(`/progress/area/${areaId}`);
    return response.data;
  },

  getEquipmentTasks: async (equipmentId: number): Promise<any[]> => {
    const response = await api.get(`/progress/equipment/${equipmentId}/tasks`);
    return response.data;
  },

  updateProgress: async (data: {
    equipmentId: number;
    discipline: 'electrical' | 'mechanical' | 'civil';
    currentProgress: number;
    observations?: string;
    photos?: File[];
    taskId?: number;
  }) => {
    // Se há fotos, usar FormData, senão usar JSON
    if (data.photos && data.photos.length > 0) {
      const formData = new FormData();
      formData.append('equipmentId', data.equipmentId.toString());
      formData.append('discipline', data.discipline);
      formData.append('currentProgress', data.currentProgress.toString());
      if (data.observations) {
        formData.append('observations', data.observations);
      }
      if (data.taskId) {
        formData.append('taskId', data.taskId.toString());
      }
      data.photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      const response = await api.post('/progress/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Enviar como JSON
      const jsonData = {
        equipmentId: data.equipmentId,
        discipline: data.discipline,
        currentProgress: data.currentProgress,
        observations: data.observations || '',
        taskId: data.taskId
      };

      const response = await api.post('/progress/update', jsonData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    }
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
  getTaskHistory: async (taskId: number, limit?: number): Promise<TaskHistory[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const response = await api.get(`/tasks/${taskId}/history?${params.toString()}`);
    return response.data;
  },

  // Buscar fotos de uma tarefa
  getTaskPhotos: async (taskId: number): Promise<any[]> => {
    const response = await api.get(`/tasks/${taskId}/photos`);
    return response.data;
  },

  // Deletar registro de histórico de progresso
  deleteTaskHistory: async (taskId: number, historyId: number) => {
    const response = await api.delete(`/tasks/${taskId}/history/${historyId}`);
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

// Serviços do Sistema
export const systemService = {
  // Buscar logs do sistema
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.level && params.level !== 'all') queryParams.append('level', params.level);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await api.get(`/system/logs?${queryParams.toString()}`);
    return response.data;
  },

  // Criar log do sistema
  createLog: async (logData: {
    level: string;
    message: string;
    details?: string;
    userAction?: string;
  }) => {
    const response = await api.post('/system/logs', logData);
    return response.data;
  },

  // Gerar backup do sistema
  generateBackup: async () => {
    const response = await api.get('/system/backup');
    return response.data;
  },

  // Listar backups disponíveis
  getBackups: async () => {
    const response = await api.get('/system/backups');
    return response.data;
  },

  // Download de backup
  downloadBackup: async (fileName: string) => {
    const response = await api.get(`/system/backups/${fileName}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Excluir backup
  deleteBackup: async (fileName: string) => {
    const response = await api.delete(`/system/backups/${fileName}`);
    return response.data;
  },

  // Buscar tarefas padrão
  getStandardTasks: async (discipline?: string) => {
    const params = new URLSearchParams();
    if (discipline) params.append('discipline', discipline);
    const response = await api.get(`/system/standard-tasks?${params.toString()}`);
    return response.data;
  },

  // Criar tarefa padrão
  createStandardTask: async (taskData: {
    discipline: string;
    name: string;
    description?: string;
    estimatedHours?: number;
    sortOrder?: number;
  }) => {
    const response = await api.post('/system/standard-tasks', taskData);
    return response.data;
  },

  // Atualizar tarefa padrão
  updateStandardTask: async (id: number, taskData: {
    discipline: string;
    name: string;
    description?: string;
    estimatedHours?: number;
    sortOrder?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/system/standard-tasks/${id}`, taskData);
    return response.data;
  },

  // Excluir tarefa padrão
  deleteStandardTask: async (id: number) => {
    const response = await api.delete(`/system/standard-tasks/${id}`);
    return response.data;
  },

  // Buscar estatísticas do sistema
  getStats: async () => {
    const response = await api.get('/system/stats');
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

// =====================================================
// INTERFACES PARA SESMT
// =====================================================

export interface SESMTOccurrenceType {
  id: number;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
}

export interface SESMTOccurrence {
  id: number;
  areaId: number;
  occurrenceTypeId: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: number;
  involvedPersons: string;
  dateTimeOccurrence: string;
  dateTimeReport: string;
  location: string;
  weatherConditions: string;
  equipmentInvolved: string;
  immediateActions: string;
  recommendations: string;
  photos: string[];
  documents: string[];
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  areaName: string;
  occurrenceTypeName: string;
  typeSeverity: string;
  reporterName: string;
}

export interface SESMTOccurrenceComment {
  id: number;
  occurrenceId: number;
  userId: number;
  comment: string;
  photos: string[];
  documents: string[];
  isInternal: boolean;
  createdAt: string;
  userName: string;
}

export interface SESMTOccurrenceHistory {
  id: number;
  occurrenceId: number;
  userId: number;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  previousSeverity?: string;
  newSeverity?: string;
  comments: string;
  photos: string[];
  documents: string[];
  createdAt: string;
  userName: string;
}

export interface SESMTStats {
  statusStats: Array<{ status: string; count: number }>;
  severityStats: Array<{ severity: string; count: number }>;
  typeStats: Array<{ typeName: string; count: number }>;
  areaStats: Array<{ areaName: string; count: number }>;
  recentStats: {
    total: number;
    critical: number;
    accidents_incidents: number;
  };
}

// =====================================================
// SERVIÇOS SESMT
// =====================================================

export const sesmtService = {
  // Buscar tipos de ocorrências
  getOccurrenceTypes: async (): Promise<SESMTOccurrenceType[]> => {
    const response = await api.get('/sesmt/occurrence-types');
    return response.data;
  },

  // Buscar ocorrências
  getOccurrences: async (params?: {
    area?: string;
    status?: string;
    severity?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SESMTOccurrence[]> => {
    const queryParams = new URLSearchParams();
    if (params?.area && params.area !== 'all') queryParams.append('area', params.area);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.severity && params.severity !== 'all') queryParams.append('severity', params.severity);
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await api.get(`/sesmt/occurrences?${queryParams.toString()}`);
    return response.data;
  },

  // Buscar ocorrência específica
  getOccurrence: async (id: number): Promise<SESMTOccurrence> => {
    const response = await api.get(`/sesmt/occurrences/${id}`);
    return response.data;
  },

  // Criar ocorrência
  createOccurrence: async (data: FormData): Promise<{ message: string; occurrence: any }> => {
    const response = await api.post('/sesmt/occurrences', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Atualizar ocorrência
  updateOccurrence: async (id: number, data: Partial<SESMTOccurrence>): Promise<{ message: string }> => {
    const response = await api.put(`/sesmt/occurrences/${id}`, data);
    return response.data;
  },

  // Buscar comentários de uma ocorrência
  getOccurrenceComments: async (id: number): Promise<SESMTOccurrenceComment[]> => {
    const response = await api.get(`/sesmt/occurrences/${id}/comments`);
    return response.data;
  },

  // Adicionar comentário
  addComment: async (id: number, data: FormData): Promise<{ message: string; comment: any }> => {
    const response = await api.post(`/sesmt/occurrences/${id}/comments`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Buscar histórico de uma ocorrência
  getOccurrenceHistory: async (id: number): Promise<SESMTOccurrenceHistory[]> => {
    const response = await api.get(`/sesmt/occurrences/${id}/history`);
    return response.data;
  },

  // Buscar estatísticas SESMT
  getStats: async (): Promise<SESMTStats> => {
    const response = await api.get('/sesmt/stats');
    return response.data;
  },
};

export default api;
