import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Building2, Wrench, TrendingUp } from "lucide-react";
import { areasService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const OperatorAreas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Buscar áreas
  const { data: areas, isLoading, error } = useQuery({
    queryKey: ['operator-areas'],
    queryFn: areasService.getAll,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  // Filtrar áreas baseado na busca
  const filteredAreas = areas?.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAreaClick = (areaId: number) => {
    navigate(`/operator/areas/${areaId}/equipment`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Áreas do Projeto</h1>
            <p className="text-muted-foreground">
              Carregando áreas disponíveis...
            </p>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Áreas do Projeto</h1>
            <p className="text-muted-foreground">
              Erro ao carregar áreas
            </p>
          </div>
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <p className="text-destructive">
              Não foi possível carregar as áreas. Tente novamente em alguns instantes.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Áreas do Projeto</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Selecione uma área para visualizar equipamentos e tarefas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredAreas.length} área{filteredAreas.length !== 1 ? 's' : ''} disponível{filteredAreas.length !== 1 ? 'is' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar áreas por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Grid de Áreas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAreas.map((area) => (
            <Card
              key={area.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                "border-2 hover:border-primary/50",
                area.status === 'completed' && "border-green-200 bg-green-50/50",
                area.status === 'inactive' && "border-gray-200 bg-gray-50/50"
              )}
              onClick={() => handleAreaClick(area.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                    {area.name}
                  </CardTitle>
                  <Badge
                    variant={area.status === 'active' ? 'default' : 
                           area.status === 'completed' ? 'secondary' : 'outline'}
                    className="ml-2 flex-shrink-0"
                  >
                    {area.status === 'active' ? 'Ativa' :
                     area.status === 'completed' ? 'Concluída' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {area.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {area.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Wrench className="h-4 w-4" />
                    <span>{area.equipmentCount} equipamento{area.equipmentCount !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">
                      {area.averageProgress}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${area.averageProgress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mensagem quando não há resultados */}
        {filteredAreas.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma área encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os termos de busca ou verifique se há áreas cadastradas.
            </p>
          </div>
        )}

        {/* Mensagem quando não há áreas */}
        {filteredAreas.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma área disponível
            </h3>
            <p className="text-muted-foreground">
              Não há áreas cadastradas no sistema no momento.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default OperatorAreas;
