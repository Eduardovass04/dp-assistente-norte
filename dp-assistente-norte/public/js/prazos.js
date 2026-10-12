// Calendário de prazos do DP. Os dias de vencimento são configuráveis em OBRIGACOES.
// Regra de segurança: se o vencimento cair em dia não útil, o sistema ANTECIPA para o dia útil anterior.

export const OBRIGACOES = [
  { id: 'folha', nome: 'Pagamento da folha (5º dia útil)', tipo: 'quintoDiaUtil' },
  { id: 'esocial', nome: 'Eventos de folha no eSocial', tipo: 'dia', dia: 15 },
  { id: 'fgts', nome: 'Guia do FGTS', tipo: 'dia', dia: 20 },
  { id: 'inss', nome: 'INSS (DCTFWeb/DARF)', tipo: 'dia', dia: 20 },
];

export function parseData(texto) {
  const [a, m, d] = String(texto).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function formatarISO(data) {
  const z = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${z(data.getMonth() + 1)}-${z(data.getDate())}`;
}

export function diasEntre(inicio, fim) {
  return Math.round((fim - inicio) / 86400000);
}

export function somarMeses(data, meses) {
  const d = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth(), Math.min(data.getDate(), ultimo));
}

const fimDeSemana = (d) => d.getDay() === 0 || d.getDay() === 6;

export function ehDiaUtil(data, feriados = []) {
  return !fimDeSemana(data) && !feriados.includes(formatarISO(data));
}

export function anteciparParaDiaUtil(data, feriados = []) {
  const d = new Date(data);
  while (!ehDiaUtil(d, feriados)) d.setDate(d.getDate() - 1);
  return d;
}

// mes de 1 a 12. contarSabado=true gera a data mais cedo (mais segura).
export function quintoDiaUtil(ano, mes, { feriados = [], contarSabado = true } = {}) {
  let contados = 0;
  const d = new Date(ano, mes - 1, 1);
  while (true) {
    const util = contarSabado
      ? d.getDay() !== 0 && !feriados.includes(formatarISO(d))
      : ehDiaUtil(d, feriados);
    if (util) contados += 1;
    if (contados === 5) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
}

function dataDaObrigacao(ob, ano, mes, opcoes) {
  if (ob.tipo === 'quintoDiaUtil') return quintoDiaUtil(ano, mes, opcoes);
  return anteciparParaDiaUtil(new Date(ano, mes - 1, ob.dia), opcoes.feriados);
}

export function classificar(dias) {
  if (dias <= 3) return 'urgente';
  if (dias <= 7) return 'atencao';
  return 'ok';
}

export function proximoPrazo(hoje, ob, opcoes = {}) {
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  let data = dataDaObrigacao(ob, base.getFullYear(), base.getMonth() + 1, opcoes);
  if (data < base) {
    const prox = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    data = dataDaObrigacao(ob, prox.getFullYear(), prox.getMonth() + 1, opcoes);
  }
  const dias = diasEntre(base, data);
  return { id: ob.id, nome: ob.nome, data, dias, status: classificar(dias) };
}

export function listarPrazos(hoje, opcoes = {}) {
  return OBRIGACOES.map((ob) => proximoPrazo(hoje, ob, opcoes)).sort((a, b) => a.data - b.data);
}

// Férias: período aquisitivo de 12 meses + período concessivo de mais 12 meses.
export function statusFerias(colaborador, hoje) {
  const inicio = parseData(colaborador.feriasPendentesDesde ?? colaborador.admissao);
  const fimAquisitivo = somarMeses(inicio, 12);
  const limite = somarMeses(fimAquisitivo, 12);
  if (hoje < fimAquisitivo) {
    return { status: 'em_aquisicao', fimAquisitivo, limite, dias: diasEntre(hoje, fimAquisitivo) };
  }
  const dias = diasEntre(hoje, limite);
  if (dias < 0) return { status: 'vencida', fimAquisitivo, limite, dias };
  if (dias <= 30) return { status: 'urgente', fimAquisitivo, limite, dias };
  if (dias <= 90) return { status: 'atencao', fimAquisitivo, limite, dias };
  return { status: 'ok', fimAquisitivo, limite, dias };
}
