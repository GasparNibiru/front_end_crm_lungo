# Continuidade do projeto Lungo CRM

Última atualização: 11/08/2026.

## Como retomar o trabalho

Ao abrir novamente o VS Code ou iniciar uma nova conversa com o Codex, use este pedido:

> Leia o arquivo `DOCUMENTACAO_PROJETO.md`, confira o estado atual dos dois repositórios e continue o trabalho seguindo o fluxo de staging e produção.

Antes de alterar qualquer coisa, conferir `git status`, a branch ativa e os commits mais recentes.

## Estrutura do sistema

O mesmo frontend atende três perfis:

- Admin Master: administração geral, organizações, supervisores, acessos, tokens, pagamentos, treinamentos e Marketplace de Leads.
- Supervisor: gestão da equipe, vendedores, mensagens, agenda compartilhada, treinamentos, RH, relatórios, metas, clientes e compra de leads.
- Corretor: operação comercial, Meus Leads, clientes, agenda, treinamentos, relatórios e compra de leads.

## Repositórios locais

Frontend:

`C:\Users\fabio\Downloads\front_end_crm_lungo`

GitHub:

`GasparNibiru/front_end_crm_lungo`

Backend:

`C:\Users\fabio\Downloads\repositorio_github\lungo-broadcast-backend`

GitHub:

`GasparNibiru/lungo-broadcast-backend`

## Ambientes e branches

### Staging

- Frontend: `https://staging-crm.lungocorretores.com.br`
- Branch do frontend: `feature/admin-master`
- Backend: `https://lungo-lungo-backend-staging.dzpywk.easypanel.host`
- Branch do backend: `staging`
- Dados persistentes do backend: caminhos em `/data-staging/`

### Produção

- Frontend: `https://crm.lungocorretores.com.br`
- Branch do frontend: `main`
- Backend: `https://lungo-disparos-app.dzpywk.easypanel.host`
- App no EasyPanel: projeto `lungo-disparos`, serviço `app`
- Branch do backend: `main`
- Dados persistentes do backend: caminhos em `/data/`

O frontend de produção deve manter em `config.js`:

```js
window.LUNGO_CONFIG = {
  API_BASE_URL: "https://lungo-disparos-app.dzpywk.easypanel.host"
};
```

O frontend de staging deve apontar para o backend de staging.

## Fluxo obrigatório para ajustes

1. Trabalhar primeiro nas branches de staging.
2. Validar sintaxe e conferir o diff.
3. Publicar no staging.
4. Confirmar a versão carregada no domínio de staging.
5. Aguardar a aprovação do usuário.
6. Promover somente o ajuste aprovado para `main`.
7. Confirmar que `config.js` de produção continua apontando para o backend de produção.
8. Validar o domínio final após a publicação.

Não publicar alterações não aprovadas diretamente em produção.

## Deploy

- O frontend é publicado automaticamente a partir do GitHub/Netlify.
- O backend de produção é implantado manualmente pelo botão **Implantar** no EasyPanel.
- Antes de publicar o frontend em produção, validar que o backend novo está online.
- Endpoints úteis do backend: `/`, `/health`, `/health/database` e `/api/crm/health`.
- A origem permitida em produção deve incluir `https://crm.lungocorretores.com.br`.

## Banco de dados

- O backend utiliza Supabase.
- As migrações ficam em `supabase/migrations` no repositório backend.
- Nunca registrar chaves, senhas ou tokens neste arquivo.
- Antes de aplicar uma migração nova, revisar o SQL e confirmar o projeto remoto vinculado.

## Estado funcional homologado

Os fluxos principais dos três perfis foram testados e aprovados antes da entrada em produção.

Entre as funcionalidades implementadas estão:

- Controle de acessos e tokens.
- Persistência de leads e clientes.
- Visão de equipe do supervisor.
- Agenda compartilhada com lembretes.
- Treinamentos com reprodução dentro do sistema.
- Mensagens do supervisor para corretores.
- RH com landing page, candidaturas e Kanban.
- Importação e exportação de clientes.
- Personalização de marca e relatórios.
- Marketplace de Leads com créditos, compra exclusiva, histórico e quantidade de vidas.

## Última correção publicada

Foi adicionada rolagem vertical à aba **Comprar leads** do corretor.

- Commit de staging: `c838eca`
- Commit de promoção em produção: `22dc3c3`
- Versão do CSS publicada: `20260811-2`

## Referências de recuperação

Antes da primeira promoção completa para produção foram criadas tags chamadas:

`production-backup-20260811-prelaunch`

Há uma tag no repositório frontend e outra no backend. Não removê-las sem uma decisão consciente.

## Cuidados importantes

- Preservar alterações locais que não pertençam à tarefa atual.
- Não misturar os caminhos `/data-staging/` e `/data/`.
- Não apontar o frontend de produção para o backend de staging.
- Atualizar a versão de cache em `index.html` quando JavaScript ou CSS for alterado.
- Depois de cada publicação, confirmar o conteúdo realmente servido pelo domínio, não apenas o sucesso do push.
- Atualizar este arquivo quando houver mudanças relevantes de arquitetura, ambiente ou deploy.
