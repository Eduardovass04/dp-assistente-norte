import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularCusto, lancamentoProvisoes, PARAMETROS } from '../public/js/custo.js';

test('salário de R$ 2.000 gera o custo mensal esperado', () => {
  const r = calcularCusto({ salario: 2000 });
  assert.equal(r.encargosMensais, 716); // 35,8% = 20% + 2% + 5,8% + 8%
  assert.equal(r.provisao13, 166.67);
  assert.equal(r.provisaoFerias, 222.22); // 1/12 + 1/3
  assert.equal(r.encargosSobreProvisoes, 139.22);
  assert.equal(r.totalMensal, 3244.11);
  assert.equal(r.totalAnual, 38929.32);
});

test('o custo real é sempre maior que o salário', () => {
  const r = calcularCusto({ salario: 1800 });
  assert.ok(r.totalMensal > r.salario);
  assert.ok(r.percentualSobreSalario > 60);
});

test('vale-transporte: empresa paga só o que passa de 6% do salário', () => {
  const r = calcularCusto({ salario: 2000, valeTransporte: 220 });
  assert.equal(r.vtEmpresa, 100); // 220 - 120
});

test('vale-transporte menor que 6% não gera custo para a empresa', () => {
  const r = calcularCusto({ salario: 2000, valeTransporte: 80 });
  assert.equal(r.vtEmpresa, 0);
});

test('benefícios entram no total mensal', () => {
  const base = calcularCusto({ salario: 2000 });
  const com = calcularCusto({ salario: 2000, valeRefeicao: 500, planoSaude: 300 });
  assert.equal(com.totalMensal, base.totalMensal + 800);
});

test('provisão de rescisão é opcional e aumenta o custo', () => {
  const sem = calcularCusto({ salario: 2000 });
  const com = calcularCusto({ salario: 2000, incluirProvisaoRescisao: true });
  assert.equal(sem.provisaoRescisao, 0);
  assert.ok(com.provisaoRescisao > 0);
  assert.ok(com.totalMensal > sem.totalMensal);
});

test('parâmetros podem ser alterados (ex.: RAT de 3%)', () => {
  const padrao = calcularCusto({ salario: 2000 });
  const rat3 = calcularCusto({ salario: 2000 }, { rat: 0.03 });
  assert.ok(rat3.totalMensal > padrao.totalMensal);
  assert.equal(PARAMETROS.rat, 0.02); // constante original não é alterada
});

test('entradas inválidas geram erro claro', () => {
  assert.throws(() => calcularCusto({ salario: 0 }), /salário/);
  assert.throws(() => calcularCusto({ salario: -100 }), /salário/);
  assert.throws(() => calcularCusto({ salario: NaN }), /salário/);
  assert.throws(() => calcularCusto({ salario: 2000, valeRefeicao: -1 }), /inválido/);
  assert.throws(() => calcularCusto(), /salário/);
});

test('lançamento contábil das provisões soma 13º, férias e encargos', () => {
  const r = calcularCusto({ salario: 2000 });
  const l = lancamentoProvisoes(r);
  assert.equal(l.valor, 528.11); // 166,67 + 222,22 + 139,22
  assert.match(l.credito, /Passivo Circulante/);
});
