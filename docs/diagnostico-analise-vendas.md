# Diagnóstico técnico — coleta/agregação de análise de vendas

Data: 2026-04-11

## 1) Endpoints analisados

### Dashboard / Relatórios
- `GET /dashboard/sales-by-period`
- `GET /dashboard/profit-by-period`
- `GET /dashboard/top-products`
- `GET /dashboard/alerts`
- `GET /dashboard/summary`
- `GET /reports/sales-by-user`
- `GET /products/low-stock/count`

### Vendas / Pagamentos
- `GET /sales`
- `POST /sales`
- `GET /sales/payment-methods`
- `GET /payments`
- `GET /payments/pendents`
- `POST /payments/:id/confirm-payment`

## 2) Problemas encontrados

1. **Inconsistência de envelope de resposta**
   - Parte do frontend esperava array/objeto direto, mas o backend pode retornar envelope (`{ success, data, meta }`).
   - Efeito: gráficos vazios, tabelas sem dados e `undefined` em KPIs.

2. **Mapeamento frágil de campos agregados**
   - Diferentes endpoints podem retornar `total`, `revenue`, `amount`, `totalValue`, etc.
   - Efeito: soma de faturamento/lucro zerando quando a chave não coincide.

3. **Contagem de vendas incorreta para ticket médio**
   - Ticket médio usava `periodData.length` (número de buckets de período) em vez de total de vendas.

4. **Consulta de lucro do período anterior incorreta**
   - Em `SalesAnalyticsPage`, `prevProfit` estava usando `salesByPeriod` (não `profitByPeriod`).

5. **Atualização da listagem de vendas após criar venda**
   - Invalidação de cache apontava para `orderS` em vez de `sales`.

6. **Baixa resiliência para dados vazios**
   - Alguns trechos não normalizavam retorno para `[]`, `0` e objetos padrão.

## 3) Correções aplicadas

1. **Padronização de leitura de resposta (envelope e arrays)**
   - Introduzido unwrapping robusto em serviços para suportar:
     - payload direto
     - `{ data: ... }`
     - `{ items: [...] }`
     - `{ data: { items: [...] } }`

2. **Normalização de métricas de analytics**
   - `salesByPeriod`, `profitByPeriod`, `salesByProduct`, `salesByUser`, `stockLow` agora mapeiam e padronizam campos numéricos e textos.
   - Fallback numérico obrigatório para `0`.

3. **Correção de ticket médio e lucro comparativo**
   - Ticket médio passa a usar soma de `count` por período.
   - `prevProfit` passa a usar consulta correta de lucro no período anterior.

4. **Padronização da leitura de pendências de pagamento**
   - Criado `paymentService.getPendents()` com fallback consistente.

5. **Correção do refresh de dados no módulo de vendas**
   - Ao criar venda, invalidação de cache agora usa a chave correta `sales`.

## 4) Estrutura de retorno esperada para consumo

Modelo recomendado (já suportado no frontend):

```json
{
  "success": true,
  "data": [],
  "meta": {}
}
```

Além disso, o frontend agora suporta (compatibilidade):
- array direto
- `{ items: [] }`
- `{ data: { items: [] } }`

## 5) Regras de fallback aplicadas

- **Números:** `0`
- **Listas:** `[]`
- **Objetos:** `{}` (com tipagem onde necessário)

## 6) Recomendações estruturais (sem quebra de arquitetura)

1. Padronizar definitivamente todos endpoints analytics para `success/data/meta`.
2. Garantir índice por `companyId + createdAt` nas coleções de vendas/pedidos/pagamentos.
3. Consolidar nomenclatura de campos agregados (`revenue`, `profit`, `count`, `period`).
4. Criar testes de contrato para endpoints do dashboard e reports.
