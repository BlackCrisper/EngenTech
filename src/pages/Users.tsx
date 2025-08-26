import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Filter, User, Mail, Shield, Eye, EyeOff, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { usersService } from '@/services/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  PermissionGuard, 
  UpdateGuard, 
  DeleteGuard,
  AdminGuard,
  SupervisorGuard,
  UserManagementGuard
} from '@/components/auth/PermissionGuard';

interface User {
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

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: 'admin' | 'supervisor' | 'engineer' | 'operator' | 'viewer';
  sector: string;
  isActive: boolean;
}

const SECTORS = [
  { value: 'all', label: 'Todos os Setores' },
  { value: 'electrical', label: 'Elétrica' },
  { value: 'mechanical', label: 'Mecânica' },
  { value: 'civil', label: 'Civil' },
  { value: 'automation', label: 'Automação' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'production', label: 'Produção' },
  { value: 'quality', label: 'Qualidade' },
  { value: 'safety', label: 'Segurança' },
  { value: 'environmental', label: 'Meio Ambiente' },
  { value: 'logistics', label: 'Logística' },
  { value: 'it', label: 'TI' },
  { value: 'hr', label: 'RH' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'other', label: 'Outros' }
];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'viewer',
    sector: 'other',
    isActive: true
  });

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { canViewUsers, canDeleteUser } = usePermissions();

  // Buscar usuários
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll
  });

  // Criar usuário
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar usuário');
    }
  });

  // Atualizar usuário
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormData }) => {
      return usersService.update(id, data as Partial<User>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
    }
  });

  // Deletar usuário
  const deleteMutation = useMutation({
    mutationFn: usersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
    }
  });

  // Toggle status do usuário
  const toggleStatusMutation = useMutation({
    mutationFn: usersService.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status do usuário atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status');
    }
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: 'viewer',
      sector: 'other',
      isActive: true
    });
    setShowPassword(false);
  };

  const handleCreate = () => {
    if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!formData.username || !formData.email || !formData.fullName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (editingUser) {
      // Preparar dados para atualização
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        sector: formData.sector,
        isActive: formData.isActive
      };

      // Adicionar senha apenas se foi fornecida
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }
      
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    }
  };

  const handleDelete = (user: User) => {
    // Verificar se o usuário atual pode deletar o usuário selecionado
    if (!canDeleteUser(user.role)) {
      toast.error('Você não tem permissão para deletar este usuário');
      return;
    }

    if (confirm(`Tem certeza que deseja deletar o usuário "${user.fullName}"?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: '', // Não preenche senha na edição
      role: user.role,
      sector: user.sector,
      isActive: user.isActive
    });
    setShowPassword(false);
  };

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate(user.id);
  };

  // Filtrar usuários baseado nas permissões do usuário atual
  const getFilteredUsers = () => {
    let filteredUsers = users;

    // Aplicar filtros de busca
    filteredUsers = filteredUsers.filter((user: User) => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSector = sectorFilter === 'all' || user.sector === sectorFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive);
      return matchesSearch && matchesRole && matchesSector && matchesStatus;
    });

    return filteredUsers;
  };

  const filteredUsers = getFilteredUsers();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'engineer': return 'bg-purple-100 text-purple-800';
      case 'operator': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'engineer': return 'Engenheiro';
      case 'operator': return 'Operador';
      case 'viewer': return 'Visualizador';
      default: return 'Desconhecido';
    }
  };

  const getSectorLabel = (sector: string) => {
    const sectorData = SECTORS.find(s => s.value === sector);
    return sectorData ? sectorData.label : 'Não definido';
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'electrical': return 'bg-yellow-100 text-yellow-800';
      case 'mechanical': return 'bg-blue-100 text-blue-800';
      case 'civil': return 'bg-orange-100 text-orange-800';
      case 'automation': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-green-100 text-green-800';
      case 'production': return 'bg-indigo-100 text-indigo-800';
      case 'quality': return 'bg-pink-100 text-pink-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'environmental': return 'bg-emerald-100 text-emerald-800';
      case 'logistics': return 'bg-cyan-100 text-cyan-800';
      case 'it': return 'bg-slate-100 text-slate-800';
      case 'hr': return 'bg-rose-100 text-rose-800';
      case 'finance': return 'bg-lime-100 text-lime-800';
      case 'commercial': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Verificar se o usuário atual pode ver a tela de usuários
  if (!canViewUsers()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie usuários, permissões e acessos do sistema</p>
          </div>
            {/* Botão de criar usuário - sempre visível para admin e supervisor */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Funções</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="engineer">Engenheiro</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Setores</SelectItem>
                  {SECTORS.slice(1).map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: User) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{user.fullName}</CardTitle>
                    <div className="flex flex-col gap-2">
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge className={getSectorColor(user.sector)}>
                        {getSectorLabel(user.sector)}
                      </Badge>
                      <Badge className={getStatusColor(user.isActive)}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{user.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <UpdateGuard resource="users">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </UpdateGuard>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {user.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    {canDeleteUser(user.role) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deletar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {filteredUsers.length === 0 && searchTerm
                  ? 'Nenhum usuário encontrado com os filtros aplicados'
                  : 'Nenhum usuário criado ainda'
                }
              </p>
              {/* Botão de criar primeiro usuário - sempre visível para admin e supervisor */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && (
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de Criação */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-username">Nome de Usuário *</Label>
                <Input
                  id="create-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite o email"
                />
              </div>
              <div>
                <Label htmlFor="create-fullName">Nome Completo *</Label>
                <Input
                  id="create-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="create-password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Digite a senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="create-role">Função</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'supervisor' | 'engineer' | 'operator' | 'viewer' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="engineer">Engenheiro</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-sector">Setor</Label>
                <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector.value} value={sector.value}>
                        {sector.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="create-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="create-isActive">Usuário Ativo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário selecionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Nome de Usuário *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite o email"
                />
              </div>
              <div>
                <Label htmlFor="edit-fullName">Nome Completo *</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-role">Função</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'supervisor' | 'engineer' | 'operator' | 'viewer' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="engineer">Engenheiro</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-sector">Setor</Label>
                <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector.value} value={sector.value}>
                        {sector.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Usuário Ativo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}