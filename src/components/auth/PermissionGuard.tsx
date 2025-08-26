import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource: string;
  action?: string;
  fallback?: React.ReactNode;
  requireWrite?: boolean;
  requireRead?: boolean;
  requireAdmin?: boolean;
  requireSupervisor?: boolean;
  requireEngineer?: boolean;
  requireOperator?: boolean;
  sector?: string;
  requireUserManagement?: boolean;
  requireTaskManagement?: boolean;
  requireEquipmentManagement?: boolean;
  requireAreaManagement?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  fallback = null,
  requireWrite = false,
  requireRead = false,
  requireAdmin = false,
  requireSupervisor = false,
  requireEngineer = false,
  requireOperator = false,
  sector,
  requireUserManagement = false,
  requireTaskManagement = false,
  requireEquipmentManagement = false,
  requireAreaManagement = false,
}) => {
  const {
    hasPermission,
    canWrite,
    canRead,
    isAdmin,
    isSupervisor,
    isEngineer,
    isOperator,
    canViewUsers,
    canManageTasks,
    canViewTasks,
    canManageEquipment,
    canViewEquipment,
    canManageAreas,
    canViewAreas,
    isLoading
  } = usePermissions();

  // Se ainda está carregando, mostrar o conteúdo (assumindo que tem permissão)
  if (isLoading) {
    return <>{children}</>;
  }

  // Verificar permissões específicas
  if (action && !hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  // Verificar permissões de escrita
  if (requireWrite && !canWrite(resource)) {
    return <>{fallback}</>;
  }

  // Verificar permissões de leitura
  if (requireRead && !canRead(resource)) {
    return <>{fallback}</>;
  }

  // Verificar hierarquia de roles
  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>;
  }

  if (requireSupervisor && !isSupervisor()) {
    return <>{fallback}</>;
  }

  if (requireEngineer && !isEngineer()) {
    return <>{fallback}</>;
  }

  if (requireOperator && !isOperator()) {
    return <>{fallback}</>;
  }

  // Verificar permissões de gerenciamento de usuários
  if (requireUserManagement && !canViewUsers()) {
    return <>{fallback}</>;
  }

  // Verificar permissões de gerenciamento de tarefas baseado no setor
  if (requireTaskManagement) {
    if (action === 'create' || action === 'update' || action === 'delete') {
      if (!canManageTasks(sector)) {
        return <>{fallback}</>;
      }
    } else {
      if (!canViewTasks(sector)) {
        return <>{fallback}</>;
      }
    }
  }

  // Verificar permissões de gerenciamento de equipamentos baseado no setor
  if (requireEquipmentManagement) {
    if (action === 'create' || action === 'update' || action === 'delete') {
      if (!canManageEquipment(sector)) {
        return <>{fallback}</>;
      }
    } else {
      if (!canViewEquipment(sector)) {
        return <>{fallback}</>;
      }
    }
  }

  // Verificar permissões de gerenciamento de áreas baseado no setor
  if (requireAreaManagement) {
    if (action === 'create' || action === 'update' || action === 'delete') {
      if (!canManageAreas(sector)) {
        return <>{fallback}</>;
      }
    } else {
      if (!canViewAreas(sector)) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
};

// Componentes específicos para facilitar o uso
export const CreateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireWrite'>> = (props) => (
  <PermissionGuard {...props} action="create" />
);

export const ReadGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireRead'>> = (props) => (
  <PermissionGuard {...props} action="read" />
);

export const UpdateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireWrite'>> = (props) => (
  <PermissionGuard {...props} action="update" />
);

export const DeleteGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireWrite'>> = (props) => (
  <PermissionGuard {...props} action="delete" />
);

export const WriteGuard: React.FC<Omit<PermissionGuardProps, 'requireWrite'>> = (props) => (
  <PermissionGuard {...props} requireWrite />
);

export const AdminGuard: React.FC<Omit<PermissionGuardProps, 'requireAdmin'>> = (props) => (
  <PermissionGuard {...props} requireAdmin />
);

export const SupervisorGuard: React.FC<Omit<PermissionGuardProps, 'requireSupervisor'>> = (props) => (
  <PermissionGuard {...props} requireSupervisor />
);

export const EngineerGuard: React.FC<Omit<PermissionGuardProps, 'requireEngineer'>> = (props) => (
  <PermissionGuard {...props} requireEngineer />
);

export const OperatorGuard: React.FC<Omit<PermissionGuardProps, 'requireOperator'>> = (props) => (
  <PermissionGuard {...props} requireOperator />
);

// Novos guards para funcionalidades específicas
export const UserManagementGuard: React.FC<Omit<PermissionGuardProps, 'requireUserManagement'>> = (props) => (
  <PermissionGuard {...props} requireUserManagement />
);

export const TaskManagementGuard: React.FC<Omit<PermissionGuardProps, 'requireTaskManagement'>> = (props) => (
  <PermissionGuard {...props} requireTaskManagement />
);

export const EquipmentManagementGuard: React.FC<Omit<PermissionGuardProps, 'requireEquipmentManagement'>> = (props) => (
  <PermissionGuard {...props} requireEquipmentManagement />
);

export const AreaManagementGuard: React.FC<Omit<PermissionGuardProps, 'requireAreaManagement'>> = (props) => (
  <PermissionGuard {...props} requireAreaManagement />
);

// Guards específicos para tarefas com setor
export const TaskCreateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireTaskManagement'>> = (props) => (
  <PermissionGuard {...props} action="create" requireTaskManagement />
);

export const TaskUpdateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireTaskManagement'>> = (props) => (
  <PermissionGuard {...props} action="update" requireTaskManagement />
);

export const TaskDeleteGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireTaskManagement'>> = (props) => (
  <PermissionGuard {...props} action="delete" requireTaskManagement />
);

export const TaskReadGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireTaskManagement'>> = (props) => (
  <PermissionGuard {...props} action="read" requireTaskManagement />
);

// Guards específicos para equipamentos com setor
export const EquipmentCreateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireEquipmentManagement'>> = (props) => (
  <PermissionGuard {...props} action="create" requireEquipmentManagement />
);

export const EquipmentUpdateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireEquipmentManagement'>> = (props) => (
  <PermissionGuard {...props} action="update" requireEquipmentManagement />
);

export const EquipmentDeleteGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireEquipmentManagement'>> = (props) => (
  <PermissionGuard {...props} action="delete" requireEquipmentManagement />
);

export const EquipmentReadGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireEquipmentManagement'>> = (props) => (
  <PermissionGuard {...props} action="read" requireEquipmentManagement />
);

// Guards específicos para áreas com setor
export const AreaCreateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireAreaManagement'>> = (props) => (
  <PermissionGuard {...props} action="create" requireAreaManagement />
);

export const AreaUpdateGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireAreaManagement'>> = (props) => (
  <PermissionGuard {...props} action="update" requireAreaManagement />
);

export const AreaDeleteGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireAreaManagement'>> = (props) => (
  <PermissionGuard {...props} action="delete" requireAreaManagement />
);

export const AreaReadGuard: React.FC<Omit<PermissionGuardProps, 'action' | 'requireAreaManagement'>> = (props) => (
  <PermissionGuard {...props} action="read" requireAreaManagement />
);
