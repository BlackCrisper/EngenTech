import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UserPermissions {
  [key: string]: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();

  // Buscar permissões do usuário logado
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {};
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/users/${user.id}/permissions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao buscar permissões');
        }
        
        const data = await response.json();
        return data.permissions;
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        return {};
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = (resource: string, action: string): boolean => {
    if (!permissions || !user) {
      return false;
    }
    
    const permissionKey = `${resource}.${action}`;
    const hasPerm = permissions[permissionKey] || false;
    return hasPerm;
  };

  // Verificar se o usuário tem qualquer permissão para um recurso
  const hasAnyPermission = (resource: string): boolean => {
    if (!permissions || !user) return false;
    
    return Object.keys(permissions).some(key => 
      key.startsWith(`${resource}.`) && permissions[key]
    );
  };

  // Verificar se o usuário tem permissão de escrita para um recurso
  const canWrite = (resource: string): boolean => {
    return hasPermission(resource, 'create') || 
           hasPermission(resource, 'update') || 
           hasPermission(resource, 'delete');
  };

  // Verificar se o usuário tem permissão de leitura para um recurso
  const canRead = (resource: string): boolean => {
    const result = hasPermission(resource, 'read');
    return result;
  };

  // Verificar se o usuário é admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  // Verificar se o usuário é supervisor ou admin
  const isSupervisor = (): boolean => {
    return user?.role === 'supervisor' || user?.role === 'admin';
  };

  // Verificar se o usuário é engenheiro ou superior
  const isEngineer = (): boolean => {
    return ['engineer', 'supervisor', 'admin'].includes(user?.role || '');
  };

  // Verificar se o usuário é operador ou superior
  const isOperator = (): boolean => {
    return ['operator', 'engineer', 'supervisor', 'admin'].includes(user?.role || '');
  };

  // Verificar se o usuário pode visualizar a tela de usuários
  const canViewUsers = (): boolean => {
    return user?.role === 'admin' || user?.role === 'supervisor';
  };

  // Verificar se o usuário pode deletar outro usuário
  const canDeleteUser = (targetUserRole: string): boolean => {
    // Apenas admin pode deletar admin
    if (targetUserRole === 'admin') {
      return user?.role === 'admin';
    }
    
    // Admin e supervisor podem deletar outros usuários
    return user?.role === 'admin' || user?.role === 'supervisor';
  };

  // Verificar se o usuário pode gerenciar tarefas baseado no setor
  const canManageTasks = (taskSector?: string): boolean => {
    // Admin e supervisor podem gerenciar todas as tarefas
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      return true;
    }

    // Se não há setor especificado, permitir acesso
    if (!taskSector) {
      return true;
    }

    // Engenheiros só podem gerenciar tarefas do seu setor
    if (user?.role === 'engineer') {
      return user.sector === taskSector || user.sector === 'all';
    }

    // Operadores e visualizadores não podem gerenciar tarefas
    return false;
  };

  // Verificar se o usuário pode visualizar tarefas baseado no setor
  const canViewTasks = (taskSector?: string): boolean => {
    // Admin e supervisor podem visualizar todas as tarefas
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      return true;
    }

    // Se não há setor especificado, permitir acesso
    if (!taskSector) {
      return true;
    }

    // Engenheiros só podem visualizar tarefas do seu setor
    if (user?.role === 'engineer') {
      return user.sector === taskSector || user.sector === 'all';
    }

    // Operadores e visualizadores podem visualizar tarefas do seu setor
    return user.sector === taskSector || user.sector === 'all';
  };

  // Verificar se o usuário pode gerenciar equipamentos baseado no setor
  const canManageEquipment = (equipmentSector?: string): boolean => {
    // Admin e supervisor podem gerenciar todos os equipamentos
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      return true;
    }

    // Se não há setor especificado, permitir acesso
    if (!equipmentSector) {
      return true;
    }

    // Engenheiros só podem gerenciar equipamentos do seu setor
    if (user?.role === 'engineer') {
      return user.sector === equipmentSector || user.sector === 'all';
    }

    // Operadores e visualizadores não podem gerenciar equipamentos
    return false;
  };

  // Verificar se o usuário pode atualizar progresso de tarefas
  const canUpdateTaskProgress = (): boolean => {
    // Operadores, engenheiros, supervisores e admins podem atualizar progresso
    return ['operator', 'engineer', 'supervisor', 'admin'].includes(user?.role || '');
  };

  // Verificar se o usuário pode visualizar equipamentos baseado no setor
  const canViewEquipment = (equipmentSector?: string): boolean => {
    // Admin e supervisor podem visualizar todos os equipamentos
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      return true;
    }

    // Se não há setor especificado, permitir acesso
    if (!equipmentSector) {
      return true;
    }

    // Engenheiros só podem visualizar equipamentos do seu setor
    if (user?.role === 'engineer') {
      return user.sector === equipmentSector || user.sector === 'all';
    }

    // Operadores e visualizadores podem visualizar equipamentos do seu setor
    return user.sector === equipmentSector || user.sector === 'all';
  };

  // Verificar se o usuário pode gerenciar áreas baseado no setor
  const canManageAreas = (areaSector?: string): boolean => {
    // Admin e supervisor podem gerenciar todas as áreas
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      return true;
    }

    // Se não há setor especificado, permitir acesso
    if (!areaSector) {
      return true;
    }

    // Engenheiros só podem gerenciar áreas do seu setor
    if (user?.role === 'engineer') {
      return user.sector === areaSector || user.sector === 'all';
    }

    // Operadores e visualizadores não podem gerenciar áreas
    return false;
  };

  // Verificar se o usuário pode visualizar áreas baseado no setor
  const canViewAreas = (areaSector?: string): boolean => {
    // Admin e supervisor podem visualizar todas as áreas
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      return true;
    }

    // Se não há setor especificado, permitir acesso
    if (!areaSector) {
      return true;
    }

    // Engenheiros só podem visualizar áreas do seu setor
    if (user?.role === 'engineer') {
      return user.sector === areaSector || user.sector === 'all';
    }

    // Operadores e visualizadores podem visualizar áreas do seu setor
    return user.sector === areaSector || user.sector === 'all';
  };

  // Verificar se o usuário é visualizador (não pode fazer alterações)
  const isViewer = (): boolean => {
    return user?.role === 'viewer';
  };

  // Obter o setor do usuário atual
  const getUserSector = (): string => {
    return user?.sector || 'other';
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    canWrite,
    canRead,
    isAdmin,
    isSupervisor,
    isEngineer,
    isOperator,
    isViewer,
    canViewUsers,
    canDeleteUser,
    canManageTasks,
    canViewTasks,
    canUpdateTaskProgress,
    canManageEquipment,
    canViewEquipment,
    canManageAreas,
    canViewAreas,
    getUserSector,
    userRole: user?.role,
    userSector: user?.sector
  };
};
