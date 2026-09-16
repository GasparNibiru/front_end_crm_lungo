# Prospecção de Empresas no staging

O frontend usa a API de staging configurada em `config.js`. A busca, aquisição e
lista de empresas adquiridas passam pelo backend; o navegador não consulta o
Supabase diretamente. Contatos de empresas ainda não adquiridas são mascarados.

Nesta fase a busca inclui apenas empresas abertas nos três anos mais recentes e
localizadas em São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba ou Porto Alegre.
O backend aplica o mesmo recorte mesmo quando o navegador não envia filtros. A
interface permite escolher uma dessas capitais, UF, categoria, CNAE, ano e porte.

Em Minhas empresas, WhatsApp abre o número adquirido, E-mail abre o aplicativo
padrão do usuário, e Enviar para Meus Leads cria uma exportação idempotente. O
agendamento segue Programar mensagem: data, hora e texto de WhatsApp. Antes de
salvar, o CRM garante que a empresa esteja em Meus Leads e usa o programador de
leads já existente. Atendimento salva situação, observações e próximo retorno
com controle de versão. Equipe distribui a empresa para um corretor ativo da
mesma organização sem consumir tokens. VOIP permanece desativado.

Testes de backend e navegador validam o recorte, chamadas, máscaras, aquisição,
exportação, ações e telas responsivas. A interface impede salvar quando o worker
de mensagens programadas está pausado. O envio real precisa ser homologado com
`SCHEDULED_FOLLOWUPS_DISABLED=false` e uma instância WhatsApp conectada no staging.
