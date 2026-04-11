# Auditoria da integração com backend ColoriSystems

Data: 2026-04-11

## Escopo avaliado
- Cliente HTTP (`src/services/api.ts`)
- Serviços de acesso a rotas (`src/services/*.ts`)
- Páginas que consomem serviços sensíveis a rotas (configurações, vendas, pedidos)

## Falhas encontradas

1. **Risco de barras duplicadas nas URLs**
   - Alguns endpoints eram declarados com barra final (ex.: `/customers/`), enquanto outros trechos já concatenavam com `/id`.
   - Isso pode gerar `//` na URL quando o backend/proxy é mais estrito.

2. **Inconsistência no retorno dos serviços**
   - `saleService.confirmPayment` retornava o objeto Axios completo, enquanto os demais métodos retornavam `data`.
   - Isso aumenta chance de erro de integração em componentes React Query e mutações.

3. **Base URL sem normalização**
   - `VITE_API_URL` podia conter barra no final e formar caminhos inconsistentes no runtime.

4. **Sem timeout global de rede**
   - Chamadas podiam ficar penduradas por tempo indefinido em falhas de rede/intermitência.

## Melhorias aplicadas

1. **Normalização de Base URL e timeout global**
   - `API_BASE_URL` agora remove barras finais automaticamente.
   - `axios` passou a usar `timeout: 15000` para falhar de forma previsível.

2. **Construção robusta de rotas no CRUD genérico**
   - Foi criado `joinPath(...)` em `crudService` para compor caminhos sem barras duplicadas.
   - Todas as operações (`getAll`, `getById`, `create`, `update`, `remove`, `converToSale`) passaram a usar essa composição.

3. **Padronização do `saleService.confirmPayment`**
   - Agora retorna apenas `data`, alinhando com o padrão adotado no projeto.

4. **Correção de endpoint com barra final**
   - `customerService` passou de `/customers/` para `/customers`.

## Recomendações adicionais (próximos passos)

1. **Matriz de contratos de rota (frontend x backend)**
   - Manter tabela versionada com: método HTTP, path, payload, resposta, códigos esperados.

2. **Retry seletivo**
   - Aplicar retry automático apenas para `GET` idempotentes e erros transitórios (5xx/timeout), evitando duplicidade em `POST`.

3. **Tratamento padronizado de 403/404/422**
   - Hoje o foco está em 401; vale mapear mensagens de negócio por status para UX e observabilidade.

4. **Testes de contrato para serviços críticos**
   - Cobrir especialmente: `/orders/:id/send`, `/orders/:id/confirm-payment`, `/payments/:id/confirm-payment`.

5. **Telemetria de falhas de rota**
   - Registrar endpoint, método, status, correlation-id e latência em um logger central.

