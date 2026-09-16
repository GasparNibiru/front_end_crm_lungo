# Prospecção de Empresas: candidata à produção

O frontend usa a API de produção definida em `config.js`. A busca, aquisição e
lista de empresas adquiridas passam pelo backend; o navegador não consulta o
Supabase diretamente. Contatos não adquiridos permanecem mascarados.

Nesta fase a busca inclui apenas empresas abertas nos três anos mais recentes e
localizadas em São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba ou Porto Alegre.
O backend também impõe esse recorte sem filtros do navegador. A interface permite
escolher capital, UF, categoria, CNAE, ano e porte.

Em Minhas empresas, WhatsApp abre o número adquirido, E-mail abre o aplicativo
padrão do usuário e Enviar para Meus Leads cria exportação idempotente. O
agendamento segue Programar mensagem: data, hora e texto de WhatsApp. O CRM
garante que a empresa esteja em Meus Leads antes de salvar na programação
existente. Atendimento salva situação, observações e retorno com controle de
versão. Equipe distribui ao corretor ativo da mesma organização sem consumir
tokens. VOIP permanece desativado.

O botão de agendamento só permite salvar quando o worker de mensagens está
habilitado. O rollout exige auditoria e aplicação da migração operacional na
base de produção, deploy do backend de produção e validação dos fluxos com
sessões reais antes de publicar o frontend. Este branch é apenas um rascunho.
