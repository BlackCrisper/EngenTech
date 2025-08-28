import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft,
  UserPlus,
  UserMinus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email: string;
  active: boolean;
  projectId: number | null;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

const ProjectUsers = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Buscar detalhes do projeto
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data.data),
    enabled: !!projectId,
  });

  // Buscar usuários do projeto
  const { data: projectUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['project-users', projectId],
    queryFn: () => api.get(`/projects/${projectId}/users`).then(res => res.data.data),
    enabled: !!projectId,
  });

  // Buscar todos os usuários disponíveis
  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users').then(res => res.data),
  });

  // Mutação para adicionar usuário ao projeto
  const addUserMutation = useMutation({
    mutationFn: (userId: number) => 
      api.post(`/projects/${projectId}/users`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-users', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Usuário adicionado ao projeto com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar usuário');
    },
  });

  // Mutação para remover usuário do projeto
  const removeUserMutation = useMutation({
    mutationFn: (userId: number) => 
      api.delete(`/projects/${projectId}/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-users', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Usuário removido do projeto com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover usuário');
    },
  });

  if (projectLoading || usersLoading || allUsersLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const projectData: Project = project;
  const projectUsersData: User[] = (projectUsers || []).map(user => ({
    ...user,
    fullName: user.fullName || 'Nome não informado',
    username: user.username || 'username',
    email: user.email || 'Email não informado',
    role: user.role || 'unknown'
  }));
  const allUsersData: User[] = (allUsers || []).map(user => ({
    ...user,
    fullName: user.fullName || 'Nome não informado',
    username: user.username || 'username',
    email: user.email || 'Email não informado',
    role: user.role || 'unknown'
  }));

  // Filtrar usuários que não estão no projeto
  const availableUsers = allUsersData.filter(user => 
    !projectUsersData.some(projectUser => projectUser.id === user.id)
  );

  // Filtrar usuários do projeto por busca
  const filteredProjectUsers = projectUsersData.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-red-100 text-red-800",
      supervisor: "bg-blue-100 text-blue-800",
      engineer: "bg-green-100 text-green-800",
      operator: "bg-yellow-100 text-yellow-800",
      viewer: "bg-gray-100 text-gray-800",
      sesmt: "bg-purple-100 text-purple-800"
    };

    return (
      <Badge className={`${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'} hover:opacity-80`}>
        {role}
      </Badge>
    );
  };

  const handleAddUser = (userId: number) => {
    addUserMutation.mutate(userId);
  };

  const handleRemoveUser = (userId: number) => {
    removeUserMutation.mutate(userId);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  Usuários do Projeto
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  {projectData.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Project Users */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Usuários do Projeto ({projectUsersData.length})
            </h2>
          </div>

          {filteredProjectUsers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjectUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{user.fullName || 'Nome não informado'}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          @{user.username || 'username'}
                        </p>
                      </div>
                      {getRoleBadge(user.role || 'unknown')}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={removeUserMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remover do Projeto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? "Tente ajustar os termos de busca."
                    : "Este projeto ainda não possui usuários."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Users */}
        {availableUsers.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Usuários Disponíveis ({availableUsers.length})
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{user.fullName || 'Nome não informado'}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          @{user.username || 'username'}
                        </p>
                      </div>
                      {getRoleBadge(user.role || 'unknown')}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleAddUser(user.id)}
                      disabled={addUserMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar ao Projeto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProjectUsers;
