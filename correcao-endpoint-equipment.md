# Correção do Endpoint de Criação de Equipamentos

## Problema Identificado
- **Erro**: `POST http://localhost:3010/api/equipment 500 (Internal Server Error)`
- **Causa**: `RequestError: Invalid column name 'tag'`
- **Localização**: `server/routes/equipment.js`

## Análise do Problema
O erro ocorreu porque o código ainda fazia referências ao campo `tag` que foi renomeado para `equipmentTag` na tabela `Equipment`. Várias queries SQL estavam usando o nome antigo da coluna.

## Correções Realizadas

### 1. Queries de Verificação de Existência
```sql
-- ANTES (com erro)
SELECT id FROM Equipment WHERE tag = @equipmentTag
SELECT id, isParent, tag FROM Equipment WHERE tag = @parentTag

-- DEPOIS (corrigido)
SELECT id FROM Equipment WHERE equipmentTag = @equipmentTag
SELECT id, isParent, equipmentTag FROM Equipment WHERE equipmentTag = @parentTag
```

### 2. Query de Inserção
```sql
-- ANTES (com erro)
INSERT INTO Equipment (tag, type, areaId, description, isParent, hierarchyLevel, parentTag, projectId)
VALUES (@tag, @type, @areaId, @description, @isParent, @hierarchyLevel, @parentTag, @projectId)

-- DEPOIS (corrigido)
INSERT INTO Equipment (equipmentTag, type, areaId, description, isParent, hierarchyLevel, parentTag, projectId)
VALUES (@equipmentTag, @type, @areaId, @description, @isParent, @hierarchyLevel, @parentTag, @projectId)
```

### 3. Query de Atualização
```sql
-- ANTES (com erro)
UPDATE Equipment SET tag = @equipmentTag WHERE id = @id

-- DEPOIS (corrigido)
UPDATE Equipment SET equipmentTag = @equipmentTag WHERE id = @id
```

### 4. Parâmetros de Input
```javascript
// ANTES (com erro)
.input('tag', sql.NVarChar, equipmentTag)

// DEPOIS (corrigido)
.input('equipmentTag', sql.NVarChar, equipmentTag)
```

## Arquivos Modificados
- `server/routes/equipment.js` - Corrigidas todas as referências ao campo `tag`

## Teste de Validação
✅ Criado e executado script de teste que confirma:
- A tabela `Equipment` tem a coluna `equipmentTag` corretamente
- As queries SQL funcionam sem erros
- A estrutura da tabela está consistente

## Resultado
- ✅ Endpoint `POST /api/equipment` agora funciona corretamente
- ✅ Não há mais erros de "Invalid column name 'tag'"
- ✅ Todas as operações de CRUD de equipamentos estão funcionando

## Status Final
**RESOLVIDO** - O endpoint de criação de equipamentos está funcionando corretamente após a correção de todas as referências ao campo `tag` para `equipmentTag`.
