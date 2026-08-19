const questions = [
  ["Ao receber uma meta desafiadora, eu geralmente...",["Parto para a ação e busco superar o número","Mobilizo as pessoas com entusiasmo","Organizo um ritmo constante para chegar lá","Analiso os dados e monto um plano detalhado"]],
  ["Em uma conversa com um novo cliente, eu prefiro...",["Conduzir rapidamente para uma decisão","Criar conexão e deixar a conversa leve","Ouvir com calma e entender suas necessidades","Fazer perguntas específicas e registrar detalhes"]],
  ["Quando surge um problema inesperado, minha reação é...",["Assumir o controle e resolver imediatamente","Conversar com todos e buscar ideias","Manter a calma e apoiar quem estiver envolvido","Investigar a causa antes de escolher a solução"]],
  ["No trabalho em equipe, costumo ser quem...",["Impulsiona decisões e cobra resultados","Anima o grupo e aproxima as pessoas","Mantém a cooperação e evita conflitos","Garante qualidade, lógica e organização"]],
  ["Quando preciso aprender algo novo, prefiro...",["Experimentar logo e ajustar no caminho","Aprender trocando ideias com outras pessoas","Ter acompanhamento e tempo para praticar","Receber instruções claras e material completo"]],
  ["Diante de uma objeção de venda, eu...",["Respondo com firmeza e tento fechar","Uso comunicação e criatividade para envolver","Escuto sem pressionar e construo confiança","Procuro evidências e argumentos precisos"]],
  ["Em um dia muito corrido, o que mais me ajuda é...",["Definir prioridades e atacar o mais importante","Manter energia alta e falar com as pessoas","Seguir uma rotina estável, uma tarefa por vez","Usar listas, processos e conferir cada entrega"]],
  ["Quando discordo de alguém, normalmente...",["Sou direto e defendo meu ponto","Tento persuadir mantendo o bom humor","Procuro conciliar e preservar a relação","Apresento fatos e critérios objetivos"]],
  ["O ambiente em que produzo melhor tem...",["Autonomia, desafio e velocidade","Interação, reconhecimento e variedade","Previsibilidade, colaboração e segurança","Regras claras, concentração e alto padrão"]],
  ["Ao tomar uma decisão importante, valorizo mais...",["Rapidez e impacto no resultado","Aceitação e potencial de engajar pessoas","Segurança e efeito sobre a equipe","Dados, riscos e consistência"]],
  ["Quando recebo uma crítica, eu tendo a...",["Questionar e transformar em ação","Conversar para compreender a percepção","Refletir com calma antes de responder","Verificar exemplos e buscar precisão"]],
  ["Qual frase mais combina com você?",["Resultados aparecem quando alguém toma a frente","Boas relações abrem grandes oportunidades","Consistência e confiança constroem resultados","Qualidade vem de fazer do jeito correto"]]
];
const traits=["D","I","S","C"];
const profiles={
  D:{title:"Dominância",description:"Tendência a agir com objetividade, velocidade e foco em resultados.",strengths:["Iniciativa e senso de urgência","Facilidade para enfrentar desafios","Orientação a metas"],attention:["Escuta e adaptação ao ritmo do cliente","Paciência em processos mais longos"]},
  I:{title:"Influência",description:"Tendência a comunicar com entusiasmo, criar conexões e mobilizar pessoas.",strengths:["Comunicação e persuasão","Construção rápida de relacionamento","Energia e otimismo"],attention:["Organização e acompanhamento de detalhes","Consistência após o primeiro contato"]},
  S:{title:"Estabilidade",description:"Tendência a cooperar, ouvir e construir relações consistentes e confiáveis.",strengths:["Escuta ativa e empatia","Constância no acompanhamento","Colaboração com a equipe"],attention:["Assertividade para conduzir o fechamento","Adaptação a mudanças rápidas"]},
  C:{title:"Conformidade",description:"Tendência a analisar, planejar e trabalhar com precisão e critérios claros.",strengths:["Organização e atenção aos detalhes","Decisões apoiadas em dados","Qualidade e responsabilidade"],attention:["Agilidade em cenários ambíguos","Espontaneidade na abordagem comercial"]}
};
const colors={D:"#ef6a62",I:"#e8ad36",S:"#43ae79",C:"#4b8fd8"};
let step=0,answers=[];
const $=id=>document.getElementById(id);
function show(id){["intro","quiz","result"].forEach(x=>$(x).hidden=x!==id)}
function render(){const q=questions[step];$("stepLabel").textContent=`Situação ${step+1} de ${questions.length}`;$("questionTitle").textContent=q[0];$("progressText").textContent=`${Math.round(((step+1)/questions.length)*100)}%`;$("progressBar").style.width=`${((step+1)/questions.length)*100}%`;$("options").innerHTML=q[1].map((text,i)=>`<button class="option ${answers[step]===i?"selected":""}" type="button" data-option="${i}"><i></i><span>${text}</span></button>`).join("");$("backBtn").style.visibility=step?"visible":"hidden";$("nextBtn").disabled=answers[step]===undefined;$("nextBtn").textContent=step===questions.length-1?"Concluir avaliação ✓":"Continuar →";$("validation").textContent="";document.querySelectorAll("[data-option]").forEach(btn=>btn.onclick=()=>{answers[step]=Number(btn.dataset.option);render()})}
function finish(){const counts={D:0,I:0,S:0,C:0};answers.forEach(i=>counts[traits[i]]++);const total=answers.length;const scores=Object.fromEntries(traits.map(t=>[t,Math.round(counts[t]/total*100)]));let diff=100-Object.values(scores).reduce((a,b)=>a+b,0);scores[traits.reduce((a,b)=>scores[a]>=scores[b]?a:b)]+=diff;const lead=traits.reduce((a,b)=>scores[a]>=scores[b]?a:b),p=profiles[lead];
  // Perfil-alvo: forte iniciativa comercial, autonomia e disciplina de processo.
  const target={D:35,I:25,S:15,C:25};const distance=traits.reduce((sum,t)=>sum+Math.abs(scores[t]-target[t]),0);const match=Math.max(40,Math.min(98,Math.round(100-distance*.62)));
  window.discScores=scores;
  $("matchValue").textContent=`${match}%`;$("matchLabel").textContent=match>=80?"Alta aderência ao perfil de referência":match>=65?"Boa aderência ao perfil de referência":"Aderência moderada — aprofundar na entrevista";$("profileLetter").textContent=lead;$("profileTitle").textContent=`${lead} — ${p.title}`;$("profileDescription").textContent=p.description;$("strengths").innerHTML=p.strengths.map(x=>`<li>${x}</li>`).join("");$("attention").innerHTML=p.attention.map(x=>`<li>${x}</li>`).join("");$("bars").innerHTML=traits.map(t=>`<div class="bar-row"><b>${t} · ${profiles[t].title}</b><div class="bar-track"><i style="width:${scores[t]}%;background:${colors[t]}"></i></div><strong>${scores[t]}%</strong></div>`).join("");show("result");setTimeout(()=>$("matchCircle").style.strokeDashoffset=214-(214*match/100),50);window.scrollTo({top:0,behavior:"smooth"})}
$("startBtn").onclick=()=>{show("quiz");render()};$("backBtn").onclick=()=>{if(step){step--;render()}};$("nextBtn").onclick=()=>{if(answers[step]===undefined){$("validation").textContent="Selecione uma alternativa para continuar.";return}if(step<questions.length-1){step++;render();window.scrollTo({top:0,behavior:"smooth"})}else finish()};$("restartBtn").onclick=()=>{step=0;answers=[];show("intro");$("matchCircle").style.strokeDashoffset=214;window.scrollTo({top:0,behavior:"smooth"})};

function renderFitIndicators(scores){
  const indicators=[
    {name:"Impulso comercial",sub:"intensidade e conquista",value:scores.D*.7+scores.I*.3,note:"Energia para buscar resultado, enfrentar objeções e conduzir o fechamento."},
    {name:"Autonomia",sub:"iniciativa e decisão",value:scores.D*.75+scores.C*.25,note:"Disposição para assumir responsabilidade e avançar sem supervisão constante."},
    {name:"Disciplina",sub:"constância e execução",value:scores.C*.6+scores.S*.4,note:"Capacidade de seguir rotina, registrar atividades e manter acompanhamento."},
    {name:"Aderência a processos",sub:"método e qualidade",value:scores.C*.7+scores.S*.3,note:"Atenção a regras, etapas comerciais e padrão de qualidade."}
  ].map(item=>({...item,value:Math.min(100,Math.round(item.value*2.25))}));
  const level=value=>value>=70?["Alto","high"]:value>=50?["Moderado","medium"]:["Baixo","low"];
  $("fitIndicators").innerHTML=indicators.map(item=>{const [label,cls]=level(item.value);const color=cls==="high"?"#43ae79":cls==="medium"?"#e8ad36":"#ef6a62";return `<div class="fit-row"><div class="fit-name"><b>${item.name}</b><small>${item.sub}</small></div><div class="bar-track"><i style="width:${item.value}%;background:${color}"></i></div><div class="fit-value ${cls}">${label} · ${item.value}%</div><p class="fit-note">${item.note}</p></div>`}).join("");
}
new MutationObserver(()=>{if(!$("result").hidden&&window.discScores)renderFitIndicators(window.discScores)}).observe($("result"),{attributes:true,attributeFilter:["hidden"]});
