const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarize}=require('../daily-assistant');
const now=new Date(2026,8,19,12);
test('daily summary uses actual dates, excludes completed work and separates categories',()=>{
 const rows=summarize({leads:[{id:'new',nome:'Ana',status:'novo'},{id:'old',status:'cotacao_enviada',updatedAt:'2026-09-10T12:00:00'},{id:'sent',status:'em_atendimento',mensagemProgramada:{data:'2026-09-18',status:'sent'},proximoRetorno:'2026-09-18'},{id:'due',status:'em_atendimento',mensagemProgramada:{data:'2026-09-19',hora:'14:00',ativo:true}},{id:'late',status:'em_atendimento',mensagemProgramada:{data:'2026-09-18',ativo:true}},{id:'archived',status:'arquivado',proximoRetorno:'2026-09-18'}],clients:[{id:'renew',dataRenovacao:'2026-10-01',status:'ativo'},{id:'done',dataRenovacao:'2026-09-01',status:'renovado'}],events:[{id:'today',title:'Reunião',startsAt:'2026-09-19T09:00:00'},{id:'past',startsAt:'2026-09-18T09:00:00'},{id:'future',startsAt:'2026-10-20T09:00:00'}]},now);
 assert.equal(rows.length,6);assert.equal(rows.filter(x=>x.group==='today').length,2);assert.equal(rows.filter(x=>x.group==='pending').length,3);assert.equal(rows.filter(x=>x.group==='portfolio').length,1);assert.ok(!rows.some(x=>['sent','done','past','future','archived'].includes(x.id)));
});
test('no inferred timestamps, duplicate reminders or sample records',()=>{
 assert.deepEqual(summarize({},now),[]);
 assert.deepEqual(summarize({leads:[{id:'x',status:'em_atendimento'},{id:'y',status:'em_atendimento',updatedAt:'invalid'}]},now),[]);
 const lead={id:'1',status:'novo',nome:'<img src=x>',_team:true,brokerName:'Corretora'};const rows=summarize({leads:[lead,lead]},now);assert.equal(rows.length,1);assert.equal(rows[0].team,true);assert.equal(rows[0].name,'<img src=x>');
});

const {salesSummary,financeSummary}=require('../daily-assistant');
test('sales use closing date rather than last edit, and parse Brazilian money',()=>{
 const s=salesSummary([{id:'1',status:'fechamento',closedAt:'2026-09-10T10:00:00',valorNegocio:'1.234,56'},{id:'2',status:'fechamento',updatedAt:'2026-09-10T10:00:00',valorNegocio:2000},{id:'3',status:'novo',valorNegocio:50},{id:'4',status:'fechamento',closedAt:'2026-08-01T10:00:00',valorNegocio:999}],now);
 assert.equal(s.count,1);assert.equal(s.value,1234.56);assert.equal(s.undated,1);assert.equal(s.open,1);
});
test('finance totals separate expected, overdue, paid by payment month and transfers',()=>{
 const t=financeSummary([{status:'pending',net_amount:100,due_date:'2026-09-18'},{status:'pending',net_amount:200,due_date:'2026-10-01'},{status:'paid',net_amount:400,paid_amount:350,paid_at:'2026-09-02T10:00:00',due_date:'2026-08-01'},{status:'paid',paid_amount:999,paid_at:'2026-08-02T10:00:00'},{status:'cancelled',net_amount:888}],[{status:'pending',expected_amount:80},{status:'paid',expected_amount:10}],now);
 assert.deepEqual(t,{pending:300,overdue:100,received:350,transfers:80});
});
