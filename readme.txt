Lungo Corretores v4.5 - Termos de Uso MVP Beta

Alteração desta versão:
- Popup obrigatório de aceite dos Termos de Uso no primeiro acesso por token.
- Aceite salvo no navegador por token e versão dos termos.
- Texto inclui período beta, instabilidades, exportação/backup de contatos e regra do Plano Legacy.

Deploy no EasyPanel:
- Criar um app separado do backend usando o repositório GasparNibiru/front_end_crm_lungo.
- Selecionar a branch feature/admin-master para staging.
- Build: Dockerfile (detectado automaticamente).
- Porta interna: 80.
- Associar o domínio staging-crm.lungocorretores.com.br ao app.
- O frontend usa o backend configurado em config.js.
- O Nginx desabilita cache para HTML, JavaScript e CSS durante a homologação.
