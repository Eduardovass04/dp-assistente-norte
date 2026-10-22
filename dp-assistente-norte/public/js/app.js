import { PROCEDIMENTOS, COLABORADORES, HOLERITE_MODELO } from './dados.js';
import { responder } from './chat.js';
import { calcularCusto, lancamentoProvisoes, PARAMETROS } from './custo.js';
import { listarPrazos, statusFerias, formatarISO } from './prazos.js';
import {
  SITUACOES, ROTULO_SITUACAO, SALARIO_MINIMO, formatarCPF, mascararCPF, adicionarColaborador,
  editarColaborador, removerColaborador, carregarColaboradores, emQuadro, filtrarColaboradores, resumoFolha,
} from './cadastro.js';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const raiz = $('#conteudo');
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (d) => d.toLocaleDateString('pt-BR');
const hoje = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const guardar = {
  ler(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; } },
  gravar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ } },
};

const ROTULO_STATUS = { ok: 'No prazo', atencao: 'Atenção', urgente: 'Urgente', vencida: 'Vencida', em_aquisicao: 'Em aquisição' };
const selo = (s) => `<span class="selo ${s}">${ROTULO_STATUS[s]}</span>`;

const estado = { procedimento: PROCEDIMENTOS[0].id, mensagens: [], colaborador: null };

// Cadastro de colaboradores: vem do navegador ou, na primeira vez, dos dados de demonstração.
const CHAVE_COLABORADORES = 'colaboradores:v1';
let colaboradores = carregarColaboradores(guardar.ler(CHAVE_COLABORADORES, null), COLABORADORES);
const salvarColaboradores = () => guardar.gravar(CHAVE_COLABORADORES, colaboradores);

/* ---------- Painel ---------- */
function telaInicio() {
  const prazos = listarPrazos(hoje());
  const urgentes = prazos.filter((p) => p.status !== 'ok');
  const feriasAlerta = emQuadro(colaboradores).filter((c) => ['atencao', 'urgente', 'vencida'].includes(statusFerias(c, hoje()).status));
  raiz.innerHTML = `
    <h1>Painel do dia</h1>
    <p class="sub">As rotinas do DP continuam funcionando mesmo quando alguém falta: procedimentos escritos, prazos com alerta e dúvidas respondidas com base no que a própria empresa definiu.</p>
    <div class="grade">
      <section class="painel">
        <h2>Próximo vencimento</h2>
        <p class="destaque">${dataBR(prazos[0].data)}</p>
        <p>${esc(prazos[0].nome)} ${selo(prazos[0].status)}</p>
      </section>
      <section class="painel">
        <h2>Prazos que pedem atenção</h2>
        <p class="destaque">${urgentes.length}</p>
        <p class="nota">de ${prazos.length} obrigações acompanhadas</p>
      </section>
      <section class="painel">
        <h2>Férias perto do limite</h2>
        <p class="destaque">${feriasAlerta.length}</p>
        <p class="nota">${feriasAlerta.length ? feriasAlerta.map((c) => esc(c.nome)).join(', ') : 'Nenhum colaborador em risco'}</p>
      </section>
    </div>
    <section class="painel">
      <h2>Cenário de demonstração</h2>
      <p>A analista de folha faltou e o substituto precisa fechar a folha. Ele abre o assistente e pergunta como fazer.</p>
      <button class="botao sinal" id="demo">Fazer a pergunta ao assistente</button>
    </section>`;
  $('#demo').onclick = () => { irPara('assistente'); enviar('Como fecho a folha de pagamento?'); };
}

/* ---------- Procedimentos ---------- */
function telaProcedimentos() {
  const proc = PROCEDIMENTOS.find((p) => p.id === estado.procedimento);
  const marcados = guardar.ler(`chk:${proc.id}`, []);
  const feitos = marcados.filter(Boolean).length;
  const pct = Math.round((feitos / proc.passos.length) * 100);
  raiz.innerHTML = `
    <h1>Procedimentos</h1>
    <p class="sub">O passo a passo de cada rotina fica registrado aqui, para que qualquer substituto consiga executá-la.</p>
    <div class="duas">
      <div class="lista-proc" role="list">
        ${PROCEDIMENTOS.map((p) => `<button data-id="${p.id}" class="${p.id === proc.id ? 'ativo' : ''}">${esc(p.titulo)}</button>`).join('')}
      </div>
      <section class="painel">
        <h2>${esc(proc.titulo)}</h2>
        <dl class="meta">
          <dt>Responsável</dt><dd>${esc(proc.responsavel)}</dd>
          <dt>Prazo</dt><dd>${esc(proc.prazo)}</dd>
        </dl>
        <p><strong>${feitos} de ${proc.passos.length} passos concluídos</strong></p>
        <div class="progresso" aria-hidden="true"><div style="width:${pct}%"></div></div>
        <ul class="checklist">
          ${proc.passos.map((passo, i) => `
            <li class="${marcados[i] ? 'feito' : ''}">
              <input type="checkbox" id="p${i}" data-i="${i}" ${marcados[i] ? 'checked' : ''}>
              <label for="p${i}" style="font-weight:400;margin:0"><span>${esc(passo)}</span></label>
            </li>`).join('')}
        </ul>
        <p style="margin-top:1rem"><button class="botao" id="zerar">Reiniciar checklist</button></p>
      </section>
    </div>`;
  raiz.querySelectorAll('.lista-proc button').forEach((b) => {
    b.onclick = () => { estado.procedimento = b.dataset.id; telaProcedimentos(); };
  });
  raiz.querySelectorAll('.checklist input').forEach((c) => {
    c.onchange = () => {
      const lista = guardar.ler(`chk:${proc.id}`, []);
      lista[Number(c.dataset.i)] = c.checked;
      guardar.gravar(`chk:${proc.id}`, lista);
      telaProcedimentos();
    };
  });
  $('#zerar').onclick = () => { guardar.gravar(`chk:${proc.id}`, []); telaProcedimentos(); };
}

/* ---------- Assistente ---------- */
const SUGESTOES = [
  'Quais documentos preciso para admitir um motorista?',
  'Qual o prazo do FGTS este mês?',
  'Como fecho a folha de pagamento?',
  'Como dar férias para um vendedor?',
];

function htmlMensagem(m) {
  if (m.autor === 'usuario') return `<div class="msg usuario">${esc(m.texto)}</div>`;
  const passos = m.passos ? `<ol>${m.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>` : '';
  const fonte = m.procedimento ? `<button class="fonte" data-proc="${m.procedimento.id}">Fonte: ${esc(m.procedimento.titulo)}</button>` : '';
  return `<div class="msg bot"><p>${esc(m.texto)}</p>${passos}${fonte}</div>`;
}

function telaAssistente() {
  raiz.innerHTML = `
    <h1>Assistente</h1>
    <p class="sub">Responde com base nos procedimentos cadastrados e mostra qual deles usou. Decisões jurídicas complexas continuam com o contador ou o advogado.</p>
    <section class="painel">
      <div class="chat" id="chat" aria-live="polite"></div>
      <form class="chat-form" id="form">
        <input id="pergunta" placeholder="Digite sua dúvida sobre o DP" autocomplete="off" aria-label="Pergunta">
        <button class="botao" type="submit">Perguntar</button>
      </form>
      <div class="chips">${SUGESTOES.map((s) => `<button type="button" class="chip">${esc(s)}</button>`).join('')}</div>
    </section>`;
  desenharChat();
  $('#form').onsubmit = (e) => { e.preventDefault(); const i = $('#pergunta'); enviar(i.value); i.value = ''; };
  raiz.querySelectorAll('.chip').forEach((c) => { c.onclick = () => enviar(c.textContent); });
  $('#pergunta').focus();
}

function desenharChat() {
  const chat = $('#chat');
  if (!chat) return;
  chat.innerHTML = estado.mensagens.length
    ? estado.mensagens.map(htmlMensagem).join('')
    : '<p class="vazio">Faça uma pergunta ou escolha uma das sugestões abaixo.</p>';
  chat.querySelectorAll('.fonte').forEach((b) => {
    b.onclick = () => { estado.procedimento = b.dataset.proc; irPara('procedimentos'); };
  });
  chat.scrollTop = chat.scrollHeight;
}

function enviar(pergunta) {
  if (!pergunta.trim()) return;
  estado.mensagens.push({ autor: 'usuario', texto: pergunta });
  estado.mensagens.push({ autor: 'bot', ...responder(pergunta, PROCEDIMENTOS) });
  desenharChat();
}

/* ---------- Prazos e férias ---------- */
function telaPrazos() {
  const prazos = listarPrazos(hoje());
  raiz.innerHTML = `
    <h1>Prazos e férias</h1>
    <p class="sub">Se um vencimento cair em fim de semana, o sistema mostra o dia útil anterior para ninguém pagar atrasado. Feriados locais devem ser conferidos.</p>
    <section class="painel">
      <h2>Próximos vencimentos</h2>
      <table>
        <thead><tr><th>Obrigação</th><th>Data</th><th class="num">Faltam</th><th>Situação</th></tr></thead>
        <tbody>${prazos.map((p) => `<tr><td>${esc(p.nome)}</td><td>${dataBR(p.data)}</td><td class="num">${p.dias} dia(s)</td><td>${selo(p.status)}</td></tr>`).join('')}</tbody>
      </table>
    </section>
    <section class="painel">
      <h2>Férias dos colaboradores</h2>
      <table>
        <thead><tr><th>Colaborador</th><th>Direito adquirido em</th><th>Limite para conceder</th><th>Situação</th></tr></thead>
        <tbody>${emQuadro(colaboradores).map((c) => {
          const s = statusFerias(c, hoje());
          return `<tr><td>${esc(c.nome)}<br><span class="nota">${esc(c.cargo)}</span></td><td>${dataBR(s.fimAquisitivo)}</td><td>${s.status === 'em_aquisicao' ? '-' : dataBR(s.limite)}</td><td>${selo(s.status)}</td></tr>`;
        }).join('') || '<tr><td colspan="4" class="vazio">Nenhum colaborador no quadro.</td></tr>'}</tbody>
      </table>
      <p class="nota" style="margin-top:.75rem">Férias concedidas depois do limite precisam ser pagas em dobro, o que vira despesa evitável.</p>
    </section>`;
}

/* ---------- Portal do colaborador ---------- */
function telaPortal() {
  const quadro = emQuadro(colaboradores);
  if (!quadro.length) {
    raiz.innerHTML = '<h1>Portal do colaborador</h1><p class="vazio">Nenhum colaborador no quadro. Cadastre alguém na aba Colaboradores.</p>';
    return;
  }
  const c = quadro.find((x) => x.id === estado.colaborador) ?? quadro[0];
  estado.colaborador = c.id;
  const descontos = HOLERITE_MODELO.descontos.map(([nome, pct]) => [nome, c.salario * pct]);
  const totalDesc = descontos.reduce((s, [, v]) => s + v, 0);
  const atestados = guardar.ler(`atestados:${c.id}`, []);
  const f = statusFerias(c, hoje());
  raiz.innerHTML = `
    <h1>Portal do colaborador</h1>
    <p class="sub">Quem trabalha em rota acessa holerite, férias e atestados em um único lugar, sem depender de mensagens e arquivos soltos.</p>
    <div class="painel">
      <label for="colab">Entrar como</label>
      <select id="colab">${quadro.map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.nome)}, ${esc(x.cargo)}</option>`).join('')}</select>
    </div>
    <div class="grade">
      <section class="painel">
        <h2>Holerite (exemplo)</h2>
        <table>
          <tbody>
            <tr><td>Salário base</td><td class="num">${brl(c.salario)}</td></tr>
            ${descontos.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">- ${brl(v)}</td></tr>`).join('')}
            <tr class="total"><td>Líquido</td><td class="num">${brl(c.salario - totalDesc)}</td></tr>
          </tbody>
        </table>
        <p class="nota">Valores ilustrativos, sem cálculo oficial de INSS e IRRF.</p>
      </section>
      <section class="painel">
        <h2>Minhas férias</h2>
        <p>${selo(f.status)}</p>
        <p>${f.status === 'em_aquisicao' ? `Direito adquirido em ${dataBR(f.fimAquisitivo)}.` : `Prazo para tirar as férias: ${dataBR(f.limite)}.`}</p>
        <p class="nota">Solicitações são enviadas ao DP com a antecedência mínima de 30 dias.</p>
      </section>
    </div>
    <section class="painel">
      <h2>Enviar atestado</h2>
      <form id="atestado">
        <div class="linha-campos">
          <div class="campo"><label for="at-data">Data do atestado</label><input type="date" id="at-data" required></div>
          <div class="campo"><label for="at-dias">Dias de afastamento</label><input type="number" id="at-dias" min="1" value="1" required></div>
        </div>
        <button class="botao" type="submit">Enviar atestado</button>
      </form>
      <h3 style="margin-top:1rem">Atestados enviados</h3>
      ${atestados.length ? `<table><tbody>${atestados.map((a) => `<tr><td>${dataBR(new Date(a.data + 'T00:00:00'))}</td><td>${a.dias} dia(s)</td><td>Recebido pelo DP</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Nenhum atestado enviado.</p>'}
    </section>`;
  $('#colab').onchange = (e) => { estado.colaborador = Number(e.target.value); telaPortal(); };
  $('#atestado').onsubmit = (e) => {
    e.preventDefault();
    atestados.unshift({ data: $('#at-data').value, dias: Number($('#at-dias').value) });
    guardar.gravar(`atestados:${c.id}`, atestados);
    telaPortal();
  };
}

/* ---------- Simulador de custo ---------- */
function telaSimulador() {
  raiz.innerHTML = `
    <h1>Custo de contratação</h1>
    <p class="sub">Antes de abrir uma vaga em uma nova cidade, veja quanto cada contratação realmente custa por mês, além do salário.</p>
    <div class="duas" style="grid-template-columns: 340px 1fr">
      <section class="painel">
        <h2>Dados da vaga</h2>
        <div class="campo"><label for="cadastrado">Preencher com colaborador cadastrado</label>
          <select id="cadastrado"><option value="">Digitar manualmente</option>${colaboradores.filter((c) => c.situacao === 'ativo').map((c) => `<option value="${c.id}">${esc(c.nome)}, ${esc(c.cargo)}</option>`).join('')}</select></div>
        <div class="campo"><label for="cargo">Cargo</label>
          <select id="cargo">
            <option value="2400">Motorista (R$ 2.400)</option>
            <option value="2100">Vendedor em rota (R$ 2.100)</option>
            <option value="1800" selected>Auxiliar de depósito (R$ 1.800)</option>
            <option value="3800">Analista de folha (R$ 3.800)</option>
          </select></div>
        <div class="campo"><label for="salario">Salário (R$)</label><input type="number" id="salario" min="0" step="50" value="1800"></div>
        <div class="campo"><label for="vt">Vale-transporte mensal (R$)</label><input type="number" id="vt" min="0" step="10" value="220"></div>
        <div class="campo"><label for="vr">Vale-refeição mensal (R$)</label><input type="number" id="vr" min="0" step="10" value="400"></div>
        <div class="campo"><label for="plano">Plano de saúde (R$)</label><input type="number" id="plano" min="0" step="10" value="0"></div>
        <div class="campo"><label for="rat">RAT (% da folha)</label><input type="number" id="rat" min="1" max="3" step="0.5" value="${PARAMETROS.rat * 100}"></div>
        <div class="campo"><label><input type="checkbox" id="resc" style="width:auto"> Provisionar multa de 40% do FGTS</label></div>
        <div class="campo"><label for="qtd">Quantidade de contratações</label><input type="number" id="qtd" min="1" value="3"></div>
      </section>
      <section class="painel" id="resultado" aria-live="polite"></section>
    </div>`;
  const ids = ['salario', 'vt', 'vr', 'plano', 'rat', 'resc', 'qtd'];
  const calcular = () => {
    const num = (id) => Number($('#' + id).value);
    const saida = $('#resultado');
    try {
      const r = calcularCusto(
        { salario: num('salario'), valeTransporte: num('vt'), valeRefeicao: num('vr'), planoSaude: num('plano'), incluirProvisaoRescisao: $('#resc').checked },
        { rat: Math.min(3, Math.max(1, num('rat') || 2)) / 100 }
      );
      const qtd = Math.max(1, Math.floor(num('qtd')) || 1);
      const l = lancamentoProvisoes(r);
      saida.innerHTML = `
        <h2>Custo mensal por colaborador</h2>
        <p class="destaque">${brl(r.totalMensal)}</p>
        <p>É ${r.percentualSobreSalario.toLocaleString('pt-BR')}% acima do salário. Em um ano: <strong>${brl(r.totalAnual)}</strong>.</p>
        <table>
          <tbody>
            <tr><td>Salário</td><td class="num">${brl(r.salario)}</td></tr>
            <tr><td>Encargos (INSS patronal, RAT, terceiros e FGTS: ${(r.aliquotaEncargos * 100).toLocaleString('pt-BR')}%)</td><td class="num">${brl(r.encargosMensais)}</td></tr>
            <tr><td>Provisão de 13º salário</td><td class="num">${brl(r.provisao13)}</td></tr>
            <tr><td>Provisão de férias + 1/3</td><td class="num">${brl(r.provisaoFerias)}</td></tr>
            <tr><td>Encargos sobre as provisões</td><td class="num">${brl(r.encargosSobreProvisoes)}</td></tr>
            ${r.provisaoRescisao ? `<tr><td>Provisão da multa do FGTS</td><td class="num">${brl(r.provisaoRescisao)}</td></tr>` : ''}
            <tr><td>Benefícios pagos pela empresa</td><td class="num">${brl(r.beneficios)}</td></tr>
            <tr class="total"><td>Total mensal</td><td class="num">${brl(r.totalMensal)}</td></tr>
          </tbody>
        </table>
        <h3 style="margin-top:1.25rem">Expansão: ${qtd} contratação(ões)</h3>
        <p>Impacto de <strong>${brl(r.totalMensal * qtd)}</strong> por mês e <strong>${brl(r.totalAnual * qtd)}</strong> por ano na folha.</p>
        <h3>Reflexo na contabilidade</h3>
        <div class="lancamento">
          Provisão mensal de 13º e férias (por colaborador):<br>
          <strong>D</strong> ${esc(l.debito)}<br>
          <strong>C</strong> ${esc(l.credito)}: ${brl(l.valor)}
        </div>
        <p class="nota" style="margin-top:.75rem">Alíquotas padrão para empresa no Lucro Presumido, sem desoneração. RAT e contribuições a terceiros variam conforme a atividade.</p>`;
    } catch (erro) {
      saida.innerHTML = `<h2>Não foi possível calcular</h2><p>${esc(erro.message)}</p>`;
    }
  };
  $('#cadastrado').onchange = (e) => {
    const c = colaboradores.find((x) => String(x.id) === e.target.value);
    if (!c) return;
    $('#salario').value = c.salario; $('#vt').value = c.valeTransporte;
    $('#vr').value = c.valeRefeicao; $('#plano').value = c.planoSaude;
    calcular();
  };
  $('#cargo').onchange = (e) => { $('#salario').value = e.target.value; calcular(); };
  ids.forEach((id) => { $('#' + id).oninput = calcular; $('#' + id).onchange = calcular; });
  calcular();
}

/* ---------- Colaboradores (cadastro) ---------- */
const FORM_VAZIO = () => ({ nome: '', cpf: '', cargo: '', cidade: '', admissao: '', salario: '', valeTransporte: '', valeRefeicao: '', planoSaude: '', situacao: 'ativo', feriasPendentesDesde: '' });
const cad = { texto: '', situacao: 'todas', form: null, aviso: null };
const SELO_SITUACAO = { ativo: 'ok', afastado: 'atencao', desligado: 'em_aquisicao' };

function apagarDadosVinculados(id) {
  try { localStorage.removeItem(`atestados:${id}`); } catch { /* sem armazenamento */ }
}

function htmlFormulario() {
  const { valores: v, erros: e, id } = cad.form;
  const campo = (nome, rotulo, tipo = 'text', attrs = '') => `
    <div class="campo">
      <label for="f-${nome}">${rotulo}</label>
      <input id="f-${nome}" name="${nome}" type="${tipo}" value="${esc(v[nome] ?? '')}" ${attrs}
        aria-invalid="${e[nome] ? 'true' : 'false'}" ${e[nome] ? `aria-describedby="e-${nome}"` : ''}>
      ${e[nome] ? `<p class="erro" id="e-${nome}">${esc(e[nome])}</p>` : ''}
    </div>`;
  const cargos = [...new Set(['Motorista', 'Vendedor em rota', 'Auxiliar de depósito', 'Analista de folha', 'Conferente', ...colaboradores.map((c) => c.cargo)])];
  return `
    <section class="painel" id="painel-form">
      <h2>${id == null ? 'Novo colaborador' : 'Editar colaborador'}</h2>
      <p class="nota">Cadastre apenas os dados necessários para as rotinas do DP. Campos com * são obrigatórios.</p>
      <form id="form-colab" novalidate autocomplete="off">
        ${e.geral ? `<p class="erro">${esc(e.geral)}</p>` : ''}
        <div class="linha-campos">
          ${campo('nome', 'Nome completo *', 'text', 'maxlength="80" required')}
          ${campo('cpf', 'CPF *', 'text', 'inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required')}
          ${campo('cargo', 'Cargo *', 'text', 'list="lista-cargos" maxlength="50" required')}
          ${campo('cidade', 'Cidade de lotação *', 'text', 'maxlength="50" placeholder="Ex.: Picos (PI)" required')}
          ${campo('admissao', 'Data de admissão *', 'date', 'required')}
          ${campo('salario', 'Salário (R$) *', 'number', 'min="0" step="0.01" required')}
          ${campo('valeTransporte', 'Vale-transporte mensal (R$)', 'number', 'min="0" step="0.01"')}
          ${campo('valeRefeicao', 'Vale-refeição mensal (R$)', 'number', 'min="0" step="0.01"')}
          ${campo('planoSaude', 'Plano de saúde (R$)', 'number', 'min="0" step="0.01"')}
          <div class="campo">
            <label for="f-situacao">Situação</label>
            <select id="f-situacao" name="situacao">
              ${SITUACOES.map((s) => `<option value="${s}" ${v.situacao === s ? 'selected' : ''}>${ROTULO_SITUACAO[s]}</option>`).join('')}
            </select>
          </div>
          ${campo('feriasPendentesDesde', 'Início do período de férias em aberto (opcional)', 'date')}
        </div>
        <datalist id="lista-cargos">${cargos.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
        <p class="nota">Salário mínimo nacional em 2026: ${brl(SALARIO_MINIMO)}. Convenções coletivas podem exigir valor maior.</p>
        <button class="botao" type="submit">Salvar</button>
        <button class="botao claro" type="button" id="cancelar">Cancelar</button>
      </form>
    </section>`;
}

function htmlLinhas() {
  const lista = filtrarColaboradores(colaboradores, { texto: cad.texto, situacao: cad.situacao });
  if (!lista.length) {
    return `<tr><td colspan="6" class="vazio">${colaboradores.length ? 'Nenhum colaborador encontrado com esse filtro.' : 'Nenhum colaborador cadastrado. Clique em "Novo colaborador".'}</td></tr>`;
  }
  return lista.map((c) => `
    <tr>
      <td>${esc(c.nome)}<br><span class="nota">${esc(c.cargo)}</span></td>
      <td>${esc(c.cidade)}</td>
      <td><span class="selo ${SELO_SITUACAO[c.situacao]}">${ROTULO_SITUACAO[c.situacao]}</span></td>
      <td class="num">${brl(c.salario)}</td>
      <td>${mascararCPF(c.cpf)}</td>
      <td class="acoes">
        <button class="link" data-acao="editar" data-id="${c.id}" aria-label="Editar ${esc(c.nome)}">Editar</button>
        <button class="link perigo" data-acao="excluir" data-id="${c.id}" aria-label="Excluir ${esc(c.nome)}">Excluir</button>
      </td>
    </tr>`).join('');
}

function telaColaboradores() {
  const folha = resumoFolha(colaboradores);
  const aviso = cad.aviso;
  raiz.innerHTML = `
    <h1>Colaboradores</h1>
    <p class="sub">O cadastro alimenta o portal, o controle de férias e o custo da folha. Cadastre quem entra, atualize quem muda e registre quem sai.</p>
    ${aviso ? `<div class="aviso ${aviso.tipo}" role="status">${esc(aviso.texto)} ${aviso.admissao ? '<button class="link" id="ir-admissao">Abrir o checklist de admissão</button>' : ''}</div>` : ''}
    <div class="grade">
      <section class="painel"><h2>Colaboradores ativos</h2><p class="destaque">${folha.ativos}</p><p class="nota">${colaboradores.length} no cadastro, incluindo afastados e desligados</p></section>
      <section class="painel"><h2>Custo mensal da folha</h2><p class="destaque">${brl(folha.totalMensal)}</p><p class="nota">${brl(folha.totalAnual)} por ano, só ativos, com encargos e provisões</p></section>
    </div>
    ${folha.porCidade.length ? `
    <section class="painel">
      <h2>Custo por cidade</h2>
      <table>
        <thead><tr><th>Cidade</th><th class="num">Colaboradores</th><th class="num">Custo mensal</th></tr></thead>
        <tbody>${folha.porCidade.map((c) => `<tr><td>${esc(c.cidade)}</td><td class="num">${c.quantidade}</td><td class="num">${brl(c.totalMensal)}</td></tr>`).join('')}</tbody>
      </table>
      <p class="nota" style="margin-top:.6rem">Calculado com as alíquotas padrão do simulador (RAT de 2%).</p>
    </section>` : ''}
    ${cad.form ? htmlFormulario() : ''}
    <section class="painel">
      <div class="barra">
        <h2 style="margin:0">Cadastro</h2>
        <input type="search" id="busca" placeholder="Buscar por nome, cargo ou cidade" aria-label="Buscar colaborador" value="${esc(cad.texto)}">
        <select id="filtro-sit" aria-label="Filtrar por situação">
          <option value="todas">Todas as situações</option>
          ${SITUACOES.map((s) => `<option value="${s}" ${cad.situacao === s ? 'selected' : ''}>${ROTULO_SITUACAO[s]}</option>`).join('')}
        </select>
        <button class="botao sinal" id="novo">Novo colaborador</button>
      </div>
      <div class="rolagem">
        <table>
          <thead><tr><th>Colaborador</th><th>Cidade</th><th>Situação</th><th class="num">Salário</th><th>CPF</th><th>Ações</th></tr></thead>
          <tbody id="linhas">${htmlLinhas()}</tbody>
        </table>
      </div>
    </section>
    <section class="painel privacidade">
      <h2>Aviso</h2>
      <ul>
        <li>O CPF aparece mascarado na lista e só é mostrado por inteiro ao editar.</li>
        <li>Coletamos só o necessário para as rotinas do DP. O portal não exibe o CPF.</li>
        <li>Ao excluir, os atestados guardados do colaborador também são apagados. Para quem saiu, prefira marcar como <strong>Desligado</strong> e manter o histórico pelo prazo legal.</li>
        <li>Neste protótipo os dados ficam apenas neste navegador e são fictícios.</li>
      </ul>
      <button class="botao claro" id="restaurar">Restaurar dados de demonstração</button>
    </section>`;

  $('#novo').onclick = () => { cad.aviso = null; cad.form = { id: null, valores: FORM_VAZIO(), erros: {} }; telaColaboradores(); $('#f-nome').focus(); };
  $('#busca').oninput = (e) => { cad.texto = e.target.value; $('#linhas').innerHTML = htmlLinhas(); };
  $('#filtro-sit').onchange = (e) => { cad.situacao = e.target.value; $('#linhas').innerHTML = htmlLinhas(); };
  $('#restaurar').onclick = () => {
    if (!confirm('Restaurar os dados de demonstração? Os colaboradores e atestados atuais serão apagados.')) return;
    colaboradores.forEach((c) => apagarDadosVinculados(c.id));
    colaboradores = COLABORADORES.map((c) => ({ ...c }));
    salvarColaboradores();
    cad.form = null; cad.aviso = { tipo: 'ok', texto: 'Dados de demonstração restaurados.' };
    telaColaboradores();
  };
  const irAdmissao = $('#ir-admissao');
  if (irAdmissao) irAdmissao.onclick = () => { estado.procedimento = 'admissao'; irPara('procedimentos'); };

  $('#linhas').onclick = (e) => {
    const b = e.target.closest('button[data-acao]');
    if (!b) return;
    const id = Number(b.dataset.id);
    const c = colaboradores.find((x) => x.id === id);
    if (!c) return;
    if (b.dataset.acao === 'editar') {
      cad.aviso = null;
      cad.form = { id, valores: { ...FORM_VAZIO(), ...c, cpf: formatarCPF(c.cpf), feriasPendentesDesde: c.feriasPendentesDesde ?? '' }, erros: {} };
      telaColaboradores();
      $('#painel-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#f-nome').focus();
    } else {
      if (!confirm(`Excluir ${c.nome}? Esta ação apaga o cadastro e os atestados guardados, e não pode ser desfeita.\n\nSe a pessoa foi desligada, prefira editar e marcar como Desligado.`)) return;
      colaboradores = removerColaborador(colaboradores, id);
      apagarDadosVinculados(id);
      salvarColaboradores();
      cad.form = null; cad.aviso = { tipo: 'ok', texto: `${c.nome} foi excluído do cadastro.` };
      telaColaboradores();
    }
  };

  if (cad.form) {
    $('#f-cpf').oninput = (e) => { e.target.value = formatarCPF(e.target.value); };
    $('#cancelar').onclick = () => { cad.form = null; telaColaboradores(); };
    $('#form-colab').onsubmit = (ev) => {
      ev.preventDefault();
      const dados = Object.fromEntries(new FormData(ev.target));
      const { id } = cad.form;
      const r = id == null
        ? adicionarColaborador(colaboradores, dados, { hoje: hoje() })
        : editarColaborador(colaboradores, id, dados, { hoje: hoje() });
      if (!r.ok) {
        cad.form = { id, valores: dados, erros: r.erros };
        telaColaboradores();
        const primeiro = document.querySelector('#form-colab [aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        return;
      }
      colaboradores = r.lista;
      salvarColaboradores();
      cad.form = null;
      cad.aviso = id == null
        ? { tipo: 'ok', texto: `${r.colaborador.nome} foi cadastrado.`, admissao: true }
        : { tipo: 'ok', texto: `Dados de ${r.colaborador.nome} atualizados.` };
      telaColaboradores();
    };
  }
}

/* ---------- Navegação ---------- */
const TELAS = { inicio: telaInicio, colaboradores: telaColaboradores, procedimentos: telaProcedimentos, assistente: telaAssistente, prazos: telaPrazos, portal: telaPortal, simulador: telaSimulador };

function irPara(nome) {
  document.querySelectorAll('#menu button').forEach((b) => b.classList.toggle('ativo', b.dataset.view === nome));
  TELAS[nome]();
  if (nome !== 'assistente') raiz.focus({ preventScroll: true });
  history.replaceState(null, '', '#' + nome);
}

document.querySelectorAll('#menu button').forEach((b) => { b.onclick = () => irPara(b.dataset.view); });
irPara(TELAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio');
