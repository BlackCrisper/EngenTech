import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Wrench, 
  ArrowLeft, 
  ChevronRight,
  Building2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { equipmentService, areasService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const OperatorEquipment = () => {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedParent, setExpandedParent] = useState<number | null>(null);

  // Buscar dados da área
  const { data: area, isLoading: areaLoading } = useQuery({
    queryKey: ['operator-area', areaId],
    queryFn: () => areasService.getById(Number(areaId)),
    enabled: !!areaId,
  });

  // Buscar equipamentos da área
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ['operator-equipment', areaId],
    queryFn: () => equipmentService.getAll({ area: area?.name }),
    enabled: !!area,
  });

  // Separar equipamentos pai e filhos
  const parentEquipment = equipment?.filter(eq => eq.isParent) || [];
  const childEquipment = equipment?.filter(eq => !eq.isParent) || [];

  // Filtrar equipamentos pai que realmente tenham filhos
  const parentEquipmentWithChildren = parentEquipment.filter(parent => {
    const children = childEquipment.filter(child => child.parentTag === parent.equipmentTag);
    return children.length > 0;
  });

  // Filtrar equipamentos pai
  const filteredParentEquipment = parentEquipmentWithChildren.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.equipmentTag.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Obter equipamentos filhos de um pai específico
  const getChildEquipment = (parentTag: string) => {
    return childEquipment.filter(eq => eq.parentTag === parentTag);
  };

  // Calcular progresso médio de um equipamento pai baseado nos filhos
  const getParentProgress = (parentTag: string) => {
    const children = getChildEquipment(parentTag);
    if (children.length === 0) return 0;
    
    const totalProgress = children.reduce((sum, child) => sum + (child.averageProgress || 0), 0);
    return Math.round(totalProgress / children.length);
  };

  const handleParentClick = (parentId: number) => {
    if (expandedParent === parentId) {
      setExpandedParent(null);
    } else {
      setExpandedParent(parentId);
    }
  };

  const handleChildClick = (equipmentId: number) => {
    navigate(`/operator/equipment/${equipmentId}/tasks`);
  };

  const handleBackClick = () => {
    navigate("/operator/areas");
  };

  if (areaLoading || equipmentLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 bg-muted animate-pulse rounded w-64" />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!area) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Áreas
          </Button>
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <p className="text-destructive">
              Área não encontrada.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header com navegação */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={handleBackClick} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {area.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Equipamentos disponíveis para operação
                </p>
              </div>
            </div>
          </div>
          
          {area.description && (
            <p className="text-muted-foreground max-w-3xl">
              {area.description}
            </p>
          )}
        </div>

        {/* Controles de busca */}
        <div className="space-y-4">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipamentos por nome ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Lista de Equipamentos Pai */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Equipamentos Principais</h2>
          
          {filteredParentEquipment.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum equipamento encontrado
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os termos de busca."
                  : "Esta área não possui equipamentos principais com filhos cadastrados."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParentEquipment.map((parentEq) => {
                const children = getChildEquipment(parentEq.equipmentTag);
                const isExpanded = expandedParent === parentEq.id;
                
                return (
                  <div key={parentEq.id} className="space-y-2">
                    {/* Equipamento Pai */}
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg",
                        "border-2 hover:border-primary/30",
                        "bg-gradient-to-r from-background to-muted/20",
                        parentEq.status === 'maintenance' && "border-yellow-200/50 bg-yellow-50/20",
                        parentEq.status === 'inactive' && "border-gray-200/50 bg-gray-50/20"
                      )}
                      onClick={() => handleParentClick(parentEq.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-primary" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                                <span className="font-mono bg-primary text-primary-foreground px-4 py-2 rounded-lg text-lg font-bold">
                                  {parentEq.equipmentTag}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-base text-muted-foreground">
                                  {parentEq.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {children.length} equipamento(s) filho(s)
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Progresso</div>
                              <div className="text-lg font-bold text-primary">
                                {getParentProgress(parentEq.equipmentTag)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Equipamentos Filhos (quando expandido) */}
                    {isExpanded && children.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {children.map((childEq) => (
                          <Card
                            key={childEq.id}
                            className={cn(
                              "cursor-pointer transition-all duration-200 hover:shadow-md",
                              "border border-border/50 hover:border-primary/30",
                              "bg-gradient-to-r from-muted/30 to-background",
                              childEq.status === 'maintenance' && "border-yellow-200/30 bg-yellow-50/10",
                              childEq.status === 'inactive' && "border-gray-200/30 bg-gray-50/10"
                            )}
                            onClick={() => handleChildClick(childEq.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-bold">
                                    {childEq.equipmentTag}
                                  </span>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      {childEq.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      Equipamento filho
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Progresso</div>
                                    <div className="text-sm font-medium text-primary">
                                      {childEq.averageProgress}%
                                    </div>
                                  </div>
                                  
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Mensagem quando não há equipamentos filhos */}
                    {isExpanded && children.length === 0 && (
                      <div className="ml-8 p-3 text-center">
                        <p className="text-sm text-muted-foreground">
                          Este equipamento não possui equipamentos filhos.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default OperatorEquipment;
