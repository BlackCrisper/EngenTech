import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Mail, 
  Bell, 
  Shield, 
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  User,
  Activity,
  Server,
  HardDrive,
  List,
  Plus,
  Edit,
  X,
  Filter,
  Calendar,
  Search
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { CapslockInput } from "@/components/ui/capslock-input";
import { CapslockTextarea } from "@/components/ui/capslock-textarea";

interface SystemLog {
  id: number;
  level: string;
  message: string;
  details?: string;
  userId?: number;
  userAction?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface Backup {
  fileName: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

interface StandardTask {
  id: number;
  discipline: string;
  name: string;
  description?: string;
  estimatedHours: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemStats {
  users: number;
  areas: number;
  equipment: number;
  tasks: number;
  standardTasks: number;
  logs: number;
  averageProgress: number;
}

const Settings = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [logFilters, setLogFilters] = useState({
    level: "all",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20
  });
  const [selectedTask, setSelectedTask] = useState<StandardTask | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['system-logs', logFilters],
    queryFn: () => systemService.getLogs(logFilters),
    enabled: activeTab === "logs"
  });

  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['system-backups'],
    queryFn: () => systemService.getBackups(),
    enabled: activeTab === "backup"
  });

  const { data: standardTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['standard-tasks'],
    queryFn: () => systemService.getStandardTasks(),
    enabled: activeTab === "tasks"
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: () => systemService.getStats()
  });

  // Mutations
  const generateBackupMutation = useMutation({
    mutationFn: systemService.generateBackup,
    onSuccess: () => {
      toast({
        title: "Backup gerado com sucesso!",
        description: "O arquivo de backup foi criado e está disponível para download.",
      });
      queryClient.invalidateQueries({ queryKey: ['system-backups'] });
      setIsBackupDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar backup",
        description: "Não foi possível gerar o backup do sistema.",
        variant: "destructive",
      });
    }
  });

  const downloadBackupMutation = useMutation({
    mutationFn: (fileName: string) => systemService.downloadBackup(fileName),
    onSuccess: (data, fileName) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: "O arquivo de backup está sendo baixado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo de backup.",
        variant: "destructive",
      });
    }
  });

  const deleteBackupMutation = useMutation({
    mutationFn: systemService.deleteBackup,
    onSuccess: () => {
      toast({
        title: "Backup excluído",
        description: "O arquivo de backup foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['system-backups'] });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir backup",
        description: "Não foi possível excluir o arquivo de backup.",
        variant: "destructive",
      });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: systemService.createStandardTask,
    onSuccess: () => {
      toast({
        title: "Tarefa criada",
        description: "A tarefa padrão foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['standard-tasks'] });
      setIsTaskDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro ao criar tarefa",
        description: "Não foi possível criar a tarefa padrão.",
        variant: "destructive",
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => systemService.updateStandardTask(id, data),
    onSuccess: () => {
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa padrão foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['standard-tasks'] });
      setIsTaskDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Não foi possível atualizar a tarefa padrão.",
        variant: "destructive",
      });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: systemService.deleteStandardTask,
    onSuccess: () => {
      toast({
        title: "Tarefa excluída",
        description: "A tarefa padrão foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['standard-tasks'] });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir tarefa",
        description: "Não foi possível excluir a tarefa padrão.",
        variant: "destructive",
      });
    }
  });

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge variant="secondary">Aviso</Badge>;
      case 'info':
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleGenerateBackup = () => {
    setIsGeneratingBackup(true);
    generateBackupMutation.mutate();
  };

  const handleDownloadBackup = (fileName: string) => {
    downloadBackupMutation.mutate(fileName);
  };

  const handleDeleteBackup = (fileName: string) => {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
      deleteBackupMutation.mutate(fileName);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: StandardTask) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa padrão?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const handleSaveTask = (formData: any) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Configure preferências e parâmetros do EnginSync
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas Padrão</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          {/* Tab Geral */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Company Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Informações da Empresa
                    </CardTitle>
                    <CardDescription>
                      Configurações básicas da empresa e projeto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nome da Empresa</Label>
                        <CapslockInput id="company-name" defaultValue="MIZU CIMENTOS" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Nome do Projeto</Label>
                        <CapslockInput id="project-name" defaultValue="EXPANSÃO PLANTA INDUSTRIAL" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company-address">Endereço</Label>
                      <CapslockInput id="company-address" defaultValue="RUA INDUSTRIAL, 1000 - DISTRITO INDUSTRIAL, SÃO PAULO - SP" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-phone">Telefone</Label>
                        <Input id="company-phone" defaultValue="(11) 3000-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-email">E-mail</Label>
                        <Input id="company-email" defaultValue="contato@mizucimentos.com" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-description">Descrição do Projeto</Label>
                      <CapslockTextarea 
                        id="project-description" 
                        defaultValue="EXPANSÃO DA CAPACIDADE PRODUTIVA DA PLANTA INDUSTRIAL COM IMPLEMENTAÇÃO DE NOVAS LINHAS DE PRODUÇÃO E MODERNIZAÇÃO DE EQUIPAMENTOS EXISTENTES."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notificações
                    </CardTitle>
                    <CardDescription>
                      Configure como e quando receber notificações
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notificações por E-mail</Label>
                          <p className="text-sm text-muted-foreground">
                            Receber relatórios e alertas por email
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Alertas de Atraso</Label>
                          <p className="text-sm text-muted-foreground">
                            Notificar quando tarefas estiverem atrasadas
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Relatórios Automáticos</Label>
                          <p className="text-sm text-muted-foreground">
                            Gerar relatórios diários automaticamente
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notificações Push</Label>
                          <p className="text-sm text-muted-foreground">
                            Receber notificações no navegador
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>Frequência de Relatórios</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Tempo Real</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="notification-emails">E-mails para Notificação</Label>
                      <Textarea 
                        id="notification-emails"
                        placeholder="email1@exemplo.com, email2@exemplo.com"
                        defaultValue="joao.silva@mizucimentos.com, maria.santos@mizucimentos.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* System Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {statsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : stats ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Versão</span>
                          <Badge variant="outline">v1.0.0</Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge className="bg-green-500 text-white">Online</Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Usuários</span>
                          <span className="font-medium">{stats.users}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Áreas</span>
                          <span className="font-medium">{stats.areas}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Equipamentos</span>
                          <span className="font-medium">{stats.equipment}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tarefas</span>
                          <span className="font-medium">{stats.tasks}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progresso Médio</span>
                          <span className="font-medium">{stats.averageProgress.toFixed(1)}%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Banco de Dados</span>
                          <Badge className="bg-green-500 text-white">Conectado</Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Erro ao carregar estatísticas
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar Padrões
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab Logs */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Logs do Sistema
                </CardTitle>
                <CardDescription>
                  Visualize e monitore as atividades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="level-filter">Nível:</Label>
                    <Select value={logFilters.level} onValueChange={(value) => setLogFilters(prev => ({ ...prev, level: value, page: 1 }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="start-date">De:</Label>
                    <Input
                      type="date"
                      value={logFilters.startDate}
                      onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                      className="w-40"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-date">Até:</Label>
                    <Input
                      type="date"
                      value={logFilters.endDate}
                      onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                      className="w-40"
                    />
                  </div>
                </div>

                {/* Tabela de Logs */}
                {logsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando logs...</p>
                  </div>
                ) : logsData ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nível</TableHead>
                          <TableHead>Mensagem</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Data/Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logsData.logs.map((log: SystemLog) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getLevelIcon(log.level)}
                                {getLevelBadge(log.level)}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              <div className="truncate" title={log.message}>
                                {log.message}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {log.userAction || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {log.ipAddress || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(log.createdAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginação */}
                    {logsData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Página {logsData.pagination.page} de {logsData.pagination.totalPages} 
                          ({logsData.pagination.total} registros)
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={logsData.pagination.page <= 1}
                            onClick={() => setLogFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={logsData.pagination.page >= logsData.pagination.totalPages}
                            onClick={() => setLogFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Backup */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup do Sistema
                </CardTitle>
                <CardDescription>
                  Gerencie backups do sistema e dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ações de Backup */}
                <div className="flex gap-4">
                  <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Database className="h-4 w-4 mr-2" />
                        Gerar Novo Backup
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Gerar Backup do Sistema</DialogTitle>
                        <DialogDescription>
                          Esta ação irá criar um backup completo de todos os dados do sistema.
                          O processo pode levar alguns minutos.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">Dados incluídos no backup:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Usuários e configurações</li>
                            <li>• Áreas e equipamentos</li>
                            <li>• Tarefas e progresso</li>
                            <li>• Histórico de atividades</li>
                            <li>• Tarefas padrão</li>
                            <li>• Logs do sistema</li>
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleGenerateBackup}
                            disabled={isGeneratingBackup}
                            className="flex-1"
                          >
                            {isGeneratingBackup ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Database className="h-4 w-4 mr-2" />
                                Confirmar Backup
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Lista de Backups */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Backups Disponíveis</h3>
                  {backupsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Carregando backups...</p>
                    </div>
                  ) : backups && backups.length > 0 ? (
                    <div className="space-y-2">
                      {backups.map((backup: Backup) => (
                        <div key={backup.fileName} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{backup.fileName}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(backup.size)} • {formatDate(backup.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadBackup(backup.fileName)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBackup(backup.fileName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum backup encontrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tarefas Padrão */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      Tarefas Padrão
                    </CardTitle>
                    <CardDescription>
                      Configure tarefas padrão para cada disciplina
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando tarefas...</p>
                  </div>
                ) : standardTasks && standardTasks.length > 0 ? (
                  <div className="space-y-4">
                    {['electrical', 'mechanical', 'civil'].map((discipline) => {
                      const disciplineTasks = standardTasks.filter((task: StandardTask) => task.discipline === discipline);
                      const disciplineName = {
                        electrical: 'Elétrica',
                        mechanical: 'Mecânica',
                        civil: 'Civil'
                      }[discipline];

                      return (
                        <div key={discipline} className="border rounded-lg">
                          <div className="p-4 bg-muted/50 border-b">
                            <h3 className="font-medium">{disciplineName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {disciplineTasks.length} tarefa{disciplineTasks.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="p-4">
                            {disciplineTasks.length > 0 ? (
                              <div className="space-y-2">
                                {disciplineTasks.map((task: StandardTask) => (
                                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                      <div className="font-medium">{task.name}</div>
                                      {task.description && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {task.description}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <span>{task.estimatedHours}h estimadas</span>
                                        <span>Ordem: {task.sortOrder}</span>
                                        <Badge variant={task.isActive ? "default" : "secondary"}>
                                          {task.isActive ? "Ativa" : "Inativa"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditTask(task)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                Nenhuma tarefa padrão para {disciplineName.toLowerCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa padrão encontrada
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança
                </CardTitle>
                <CardDescription>
                  Configurações de segurança e acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autenticação em Dois Fatores</Label>
                      <p className="text-sm text-muted-foreground">
                        Maior segurança para contas administrativas
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Forçar Senha Forte</Label>
                      <p className="text-sm text-muted-foreground">
                        Exigir senhas complexas para todos os usuários
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Log de Atividades</Label>
                      <p className="text-sm text-muted-foreground">
                        Registrar todas as ações dos usuários
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Tempo de Sessão (minutos)</Label>
                  <Select defaultValue="480">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="480">8 horas</SelectItem>
                      <SelectItem value="1440">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">Chave API do Sistema</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        defaultValue="sk-mizucimentos-prod-2024-xyz789"
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Gerar Nova
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para Criar/Editar Tarefa Padrão */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTask ? 'Editar Tarefa Padrão' : 'Nova Tarefa Padrão'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes da tarefa padrão
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              task={selectedTask}
              onSave={handleSaveTask}
              onCancel={() => setIsTaskDialogOpen(false)}
              isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

// Componente do Formulário de Tarefa
interface TaskFormProps {
  task: StandardTask | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TaskForm = ({ task, onSave, onCancel, isLoading }: TaskFormProps) => {
  const [formData, setFormData] = useState({
    discipline: task?.discipline || 'electrical',
    name: task?.name || '',
    description: task?.description || '',
    estimatedHours: task?.estimatedHours || 0,
    sortOrder: task?.sortOrder || 0,
    isActive: task?.isActive !== undefined ? task.isActive : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discipline">Disciplina</Label>
          <Select value={formData.discipline} onValueChange={(value) => setFormData(prev => ({ ...prev, discipline: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electrical">Elétrica</SelectItem>
              <SelectItem value="mechanical">Mecânica</SelectItem>
              <SelectItem value="civil">Civil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Ordem</Label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Tarefa</Label>
        <CapslockInput
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="DIGITE O NOME DA TAREFA"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <CapslockTextarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="DESCRIÇÃO DETALHADA DA TAREFA"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedHours">Horas Estimadas</Label>
        <Input
          type="number"
          step="0.5"
          value={formData.estimatedHours}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
          min="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label>Tarefa Ativa</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {task ? 'Atualizar' : 'Criar'}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default Settings;