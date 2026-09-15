# Prospecção — interface candidata à produção

API preservada: backend de produção definido em config.js. O módulo novo usa
/api/prospecting/{wallet,companies,acquisitions,my-companies}. Não usa chamadas
diretas a Supabase nem fallback para rotas que entreguem contatos desprotegidos.

Buscar empresas abre inicialmente. Filtros ficam na página: UF, categorias com
checkboxes, CNAEs adicionados em chips, ano e porte. Paginação no servidor.
Sem filtro de cidade nem modal de filtros.

Cards mostram contatos mascarados ou adquiridos conforme a API. Seleção até 100,
confirmação de custo/saldo, chave idempotente preservada para retry, atualização de
saldo/lista e Minhas empresas sem recarregar o CRM. Saldo indisponível ou insuficiente
impede confirmar pela interface; a regra definitiva continua na RPC do backend.

Minhas empresas contém dados completos e data da aquisição. WhatsApp é somente
link explícito ao número adquirido. Agendamento, e-mail, VOIP, atendimento e
equipe (supervisor) estão desabilitados. Sugestão de abordagem pode ser
editada/copiada localmente, sem persistência ou envio automático.

`Enviar para Meus Leads` é a
primeira ação integrada em `Minhas empresas`. Envia apenas o ID do direito
adquirido para `/api/prospecting/exports`, consulta o estado e oferece `Abrir
Meus Leads` depois de confirmação. Falha ambígua pede revisão sem repetir a
criação do lead. As demais ações continuam bloqueadas. Essa interface exige o
deploy separado do backend de produção com o processador de exportação e a
migration operacional de produção validada antes do backend.

Solicitar tokens abre WhatsApp 5555992102864 com a mensagem solicitada.
Estilos em prospecting.css afetam somente #view-business-intelligence; Dockerfile
inclui o novo arquivo. Temas claro/escuro preservados fora da Prospecção.
Logout e troca de sessão limpam contatos em memória; respostas antigas não podem
preencher a tela de outro usuário.

## Testes

- `npm ci`; `npm test`: três verificações de integração estrutural e segurança.
- `npm run test:e2e`: Chrome instalado, Playwright. API sintética/interceptada,
  sem contatos reais ou requisições externas. 23 grupos de verificações passaram.
- Compra em lote, confirmação, falha de rede/retry com a mesma chave, saldo,
  desbloqueio, Minhas empresas, filtros, chips, paginação, loading/vazio/erro,
  troca de sessão, limpeza no logout, cópia de abordagem e ações desabilitadas.
- 1440x900, 1280x720, 768x1024, 390x844 e 320x720, light/dark, ambas as subabas.
  Sem overflow horizontal. Containers existentes de corretor/supervisor também
  verificados em desktop/mobile; screenshots em test-results/ (não versionados).

## Publicação

Esta cópia de revisão ainda não foi publicada. O Dockerfile serve os assets via
Nginx. A promoção real deve ocorrer somente após a migration de produção e o
deploy manual do backend protegido. Enquanto os novos endpoints não estiverem
publicados, a UI informa indisponibilidade, sem recorrer a contatos legados.
Após os deploys, validar busca mascarada, carteira, aquisição e exportação com
sessões reais dos dois perfis, sem compras duplicadas.
