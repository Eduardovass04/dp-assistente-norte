import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  quintoDiaUtil, formatarISO, proximoPrazo, listarPrazos, OBRIGACOES,
  statusFerias, somarMeses, anteciparParaDiaUtil, diasEntre,
} from '../public/js/prazos.js';

const data = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
const obr = (id) => OBRIGACOES.find((o) => o.id === id);

test('5º dia útil contando sábados (data mais segura)', () => {
  assert.equal(formatarISO(quintoDiaUtil(2026, 10)), '2026-10-06');
  assert.equal(formatarISO(quintoDiaUtil(2026, 11)), '2026-11-06');
});

test('5º dia útil sem contar sábados', () => {
  assert.equal(formatarISO(quintoDiaUtil(2026, 10, { contarSabado: false })), '2026-10-07');
});

test('feriados deslocam o 5º dia útil', () => {
  const r = quintoDiaUtil(2026, 11, { feriados: ['2026-11-02'] });
  assert.equal(formatarISO(r), '2026-11-07');
});

test('vencimento em fim de semana é antecipado para sexta', () => {
  // 20/12/2026 é domingo
  assert.equal(formatarISO(anteciparParaDiaUtil(data('2026-12-20'))), '2026-12-18');
});

test('feriado é tratado como dia não útil na antecipação', () => {
  assert.equal(formatarISO(anteciparParaDiaUtil(data('2026-11-20'), ['2026-11-20'])), '2026-11-19');
});

test('próximo prazo do FGTS no mesmo mês', () => {
  const p = proximoPrazo(data('2026-10-11'), obr('fgts'));
  assert.equal(formatarISO(p.data), '2026-10-20');
  assert.equal(p.dias, 9);
  assert.equal(p.status, 'ok');
});

test('eSocial a 4 dias do vencimento fica em atenção', () => {
  const p = proximoPrazo(data('2026-10-11'), obr('esocial'));
  assert.equal(formatarISO(p.data), '2026-10-15');
  assert.equal(p.status, 'atencao');
});

test('prazo no próprio dia é urgente (0 dias)', () => {
  const p = proximoPrazo(data('2026-10-15'), obr('esocial'));
  assert.equal(p.dias, 0);
  assert.equal(p.status, 'urgente');
});

test('prazo que já passou no mês vai para o mês seguinte', () => {
  const p = proximoPrazo(data('2026-10-11'), obr('folha'));
  assert.equal(formatarISO(p.data), '2026-11-06');
  assert.equal(p.dias, 26);
});

test('virada de ano: prazo de dezembro passado vira janeiro', () => {
  const p = proximoPrazo(data('2026-12-28'), obr('esocial'));
  assert.equal(formatarISO(p.data), '2027-01-15');
});

test('listarPrazos retorna todas as obrigações em ordem de data', () => {
  const lista = listarPrazos(data('2026-10-11'));
  assert.equal(lista.length, OBRIGACOES.length);
  for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].data <= lista[i].data);
});

test('somarMeses respeita fim de mês', () => {
  assert.equal(formatarISO(somarMeses(data('2026-01-31'), 1)), '2026-02-28');
  assert.equal(formatarISO(somarMeses(data('2025-03-10'), 12)), '2026-03-10');
});

test('diasEntre conta dias corridos', () => {
  assert.equal(diasEntre(data('2026-10-11'), data('2026-10-20')), 9);
});

const colab = { admissao: '2025-03-10', feriasPendentesDesde: null };

test('férias: período aquisitivo em andamento', () => {
  assert.equal(statusFerias(colab, data('2025-12-01')).status, 'em_aquisicao');
});

test('férias: direito adquirido e prazo longe do limite', () => {
  const s = statusFerias(colab, data('2026-10-11'));
  assert.equal(s.status, 'ok');
  assert.equal(formatarISO(s.limite), '2027-03-10');
  assert.equal(s.dias, 150);
});

test('férias: atenção a menos de 90 dias do limite', () => {
  assert.equal(statusFerias(colab, data('2027-01-15')).status, 'atencao');
});

test('férias: urgente a menos de 30 dias do limite', () => {
  assert.equal(statusFerias(colab, data('2027-02-20')).status, 'urgente');
});

test('férias: vencida após o limite (risco de pagamento em dobro)', () => {
  assert.equal(statusFerias(colab, data('2027-03-11')).status, 'vencida');
});

test('férias: usa feriasPendentesDesde quando informado', () => {
  const c = { admissao: '2024-02-05', feriasPendentesDesde: '2025-02-05' };
  const s = statusFerias(c, data('2026-10-11'));
  assert.equal(formatarISO(s.fimAquisitivo), '2026-02-05');
  assert.equal(formatarISO(s.limite), '2027-02-05');
});
