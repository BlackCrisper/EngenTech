import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Eye,
  Share2,
  Printer,
  FileSpreadsheet,
  Globe,
  Clock,
  User,
  Building2,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/api";
import { toast } from "sonner";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [reportType, setReportType] = useState("daily");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("pdf");

  // Buscar dados para relatórios
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports-data'],
    queryFn: () => reportsService.getReportData(),
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const reports = [
    {
      id: "RPT-2024-001",
      title: "Relatório Diário - 25/08/2024",
      type: "daily",
      date: new Date("2024-08-25"),
      author: "Administrador",
      areas: ["Todas as Áreas"],
      equipments: reportData?.totalEquipment || 0,
      tasksCompleted: reportData?.completedTasks || 0,
      totalTasks: reportData?.totalTasks || 0,
      status: "generated",
      size: "2.4 MB"
    },
    {
      id: "RPT-2024-002", 
      title: "Relatório Semanal - Sem 34/2024",
      type: "weekly",
      date: new Date("2024-08-24"),
      author: "Administrador",
      areas: ["Todas as Áreas"],
      equipments: reportData?.totalEquipment || 0,
      tasksCompleted: reportData?.completedTasks || 0,
      totalTasks: reportData?.totalTasks || 0,
      status: "generating",
      size: "5.8 MB"
    },
    {
      id: "RPT-2024-003",
      title: "Relatório Mensal - Agosto/2024", 
      type: "monthly",
      date: new Date("2024-08-20"),
      author: "Administrador",
      areas: ["Todas as Áreas"],
      equipments: reportData?.totalEquipment || 0,
      tasksCompleted: reportData?.completedTasks || 0,
      totalTasks: reportData?.totalTasks || 0,
      status: "generated",
      size: "12.3 MB"
    }
  ];

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "daily": return "bg-blue-100 text-blue-800";
      case "weekly": return "bg-orange-100 text-orange-800";
      case "monthly": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "daily": return "Diário";
      case "weekly": return "Semanal";
      case "monthly": return "Mensal";
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated": return "bg-green-100 text-green-800";
      case "generating": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "generated": return "Gerado";
      case "generating": return "Gerando...";
      case "error": return "Erro";
      default: return status;
    }
  };

  const handleGenerateReport = () => {
    toast.success(`Relatório ${getReportTypeLabel(reportType)} gerado com sucesso!`);
  };

  const handleDownloadReport = (reportId: string) => {
    toast.success(`Download do relatório ${reportId} iniciado!`);
  };

  const handleViewReport = (reportId: string) => {
    toast.info(`Visualizando relatório ${reportId}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios Avançados</h1>
            <p className="text-muted-foreground">
              Gere e gerencie relatórios consolidados de progresso e tarefas
            </p>
          </div>
          <Button onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Equipamentos</p>
                  <p className="text-2xl font-bold">{reportData?.totalEquipment || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tarefas Concluídas</p>
                  <p className="text-2xl font-bold">{reportData?.completedTasks || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
                  <p className="text-2xl font-bold">{reportData?.averageProgress || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alertas</p>
                  <p className="text-2xl font-bold">{reportData?.alerts || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Report Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Geração de Relatório
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para gerar um novo relatório personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Relatório Diário</SelectItem>
                    <SelectItem value="weekly">Relatório Semanal</SelectItem>
                    <SelectItem value="monthly">Relatório Mensal</SelectItem>
                    <SelectItem value="custom">Período Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="this-week">Esta Semana</SelectItem>
                    <SelectItem value="last-week">Semana Passada</SelectItem>
                    <SelectItem value="this-month">Este Mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="areas">Áreas</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Áreas</SelectItem>
                    <SelectItem value="producao-a">Área de Produção A</SelectItem>
                    <SelectItem value="producao-b">Área de Produção B</SelectItem>
                    <SelectItem value="ensacamento">Estação de Ensacamento</SelectItem>
                    <SelectItem value="laboratorio">Laboratório de Qualidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button className="flex-1" onClick={handleGenerateReport}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avançados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Relatórios Recentes
            </CardTitle>
            <CardDescription>
              Visualize e gerencie relatórios gerados recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Gerado por {report.author} • {report.date.toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getReportTypeColor(report.type)}>
                          {getReportTypeLabel(report.type)}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusLabel(report.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {report.equipments} equipamentos • {report.tasksCompleted}/{report.totalTasks} tarefas
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={report.status === 'generating'}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Relatório de Progresso</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Análise detalhada do progresso por área e disciplina
              </p>
              <Button variant="outline" className="w-full">
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Relatório de Performance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Métricas de eficiência e produtividade da equipe
              </p>
              <Button variant="outline" className="w-full">
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold mb-2">Relatório de Alertas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tarefas em atraso e problemas identificados
              </p>
              <Button variant="outline" className="w-full">
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;