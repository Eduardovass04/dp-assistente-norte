import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpfValido, formatarCPF, mascararCPF, somenteDigitos, validarColaborador,
  adicionarColaborador, editarColaborador, removerColaborador, proximoId,
  carregarColaboradores, emQuadro, filtrarColaboradores, custoDoColaborador,
  resumoFolha, SALARIO_MINIMO,
} from '../public/js/cadastro.js';
import { COLABORADORES } from '../public/js/dados.js';

const valido = () => ({
  nome: 'Paulo Roberto Alves', cpf: '987.654.321-00', cargo: 'Motorista', cidade: 'Oeiras (PI)',
  admissao: '2026-10-01', salario: 2400, valeTransporte: 220, valeRefeicao: 400, planoSaude: 0,
  situacao: 'ativo',
});
const hoje = new Date(2026, 9, 11); // 11/10/2026

/* ----- CPF ----- */
test('CPFs válidos são aceitos, com ou sem pontuação', () => {
  assert.equal(cpfValido('123.456.789-09'), true);
  assert.equal(cpfValido('11144477735'), true);
});

test('CPFs inválidos são recusados', () => {
  assert.equal(cpfValido('123.456.789-00'), false); // dígito verificador errado
  assert.equal(cpfValido('111.111.111-11'), false); // todos iguais
  assert.equal(cpfValido('1234'), false);
  assert.equal(cpfValido(''), false);
  assert.equal(cpfValido(null), false);
});

test('formatarCPF acompanha a digitação e ignora letras', () => {
  assert.equal(formatarCPF('1234'), '123.4');
  assert.equal(formatarCPF('123456'), '123.456');
  assert.equal(formatarCPF('1234567890'), '123.456.789-0');
  assert.equal(formatarCPF('12345678909'), '123.456.789-09');
  assert.equal(formatarCPF('12a3b45678909999'), '123.456.789-09');
  assert.equal(somenteDigitos('123.456.789-09'), '12345678909');
});

test('mascararCPF esconde os dígitos sensíveis', () => {
  assert.equal(mascararCPF('12345678909'), '***.456.789-**');
  assert.equal(mascararCPF('123'), '***.***.***-**');
  assert.ok(!mascararCPF('12345678909').includes('123.'));
});

/* ----- Validação ----- */
test('cadastro correto é aceito e os valores são normalizados', () => {
  const r = validarColaborador({ ...valido(), nome: '  Paulo   Roberto Alves ' }, { hoje });
  assert.equal(r.ok, true);
  assert.equal(r.valores.nome, 'Paulo Roberto Alves');
  assert.equal(r.valores.cpf, '98765432100');
});

test('nome: exige nome completo e recusa números e símbolos', () => {
  assert.ok(validarColaborador({ ...valido(), nome: 'Paulo' }).erros.nome);
  assert.ok(validarColaborador({ ...valido(), nome: '' }).erros.nome);
  assert.ok(validarColaborador({ ...valido(), nome: 'Paulo 123 Alves' }).erros.nome);
  assert.ok(validarColaborador({ ...valido(), nome: 'Paulo <b>Alves' }).erros.nome);
});

test('CPF: obrigatório, válido e sem repetição', () => {
  assert.match(validarColaborador({ ...valido(), cpf: '' }).erros.cpf, /Informe/);
  assert.match(validarColaborador({ ...valido(), cpf: '111.111.111-11' }).erros.cpf, /inválido/);
  const lista = [{ id: 1, cpf: '98765432100' }];
  assert.match(validarColaborador(valido(), { lista }).erros.cpf, /Já existe/);
});

test('admissão: data real, a partir de 2000 e no máximo 60 dias no futuro', () => {
  assert.ok(validarColaborador({ ...valido(), admissao: '2026-02-31' }).erros.admissao);
  assert.ok(validarColaborador({ ...valido(), admissao: 'ontem' }).erros.admissao);
  assert.ok(validarColaborador({ ...valido(), admissao: '1999-12-31' }).erros.admissao);
  assert.ok(validarColaborador({ ...valido(), admissao: '2026-12-20' }, { hoje }).erros.admissao); // 70 dias
  assert.equal(validarColaborador({ ...valido(), admissao: '2026-11-01' }, { hoje }).ok, true); // pré-cadastro
});

test('salário: não pode ser menor que o mínimo nacional', () => {
  assert.ok(validarColaborador({ ...valido(), salario: SALARIO_MINIMO - 1 }).erros.salario);
  assert.equal(validarColaborador({ ...valido(), salario: SALARIO_MINIMO }).ok, true);
  assert.ok(validarColaborador({ ...valido(), salario: '' }).erros.salario);
  assert.ok(validarColaborador({ ...valido(), salario: 'abc' }).erros.salario);
});

test('benefícios negativos são recusados; vazios valem zero', () => {
  assert.ok(validarColaborador({ ...valido(), valeRefeicao: -5 }).erros.valeRefeicao);
  const r = validarColaborador({ ...valido(), valeTransporte: '', planoSaude: '' });
  assert.equal(r.ok, true);
  assert.equal(r.valores.valeTransporte, 0);
});

test('situação inválida é recusada', () => {
  assert.ok(validarColaborador({ ...valido(), situacao: 'demitido' }).erros.situacao);
});

test('férias pendentes: data válida e não anterior à admissão', () => {
  assert.ok(validarColaborador({ ...valido(), feriasPendentesDesde: '2020-01-01' }).erros.feriasPendentesDesde);
  assert.ok(validarColaborador({ ...valido(), feriasPendentesDesde: '2026-13-01' }).erros.feriasPendentesDesde);
  assert.equal(validarColaborador({ ...valido(), feriasPendentesDesde: '2026-10-01' }).ok, true);
});

test('vários erros são devolvidos de uma vez', () => {
  const r = validarColaborador({ nome: '', cpf: '1', cargo: '', cidade: '', admissao: '', salario: '' });
  assert.equal(r.ok, false);
  assert.ok(Object.keys(r.erros).length >= 6);
});

test('entrada nula não quebra', () => {
  assert.equal(validarColaborador(null).ok, false);
  assert.equal(validarColaborador(undefined).ok, false);
});

/* ----- Operações ----- */
test('adicionar cria id novo e não altera a lista original', () => {
  const original = COLABORADORES.map((c) => ({ ...c }));
  const r = adicionarColaborador(original, valido(), { hoje });
  assert.equal(r.ok, true);
  assert.equal(r.colaborador.id, 5);
  assert.equal(r.lista.length, 5);
  assert.equal(original.length, 4);
});

test('adicionar com erro devolve a lista intacta', () => {
  const r = adicionarColaborador(COLABORADORES, { ...valido(), cpf: '123' });
  assert.equal(r.ok, false);
  assert.equal(r.lista, COLABORADORES);
});

test('adicionar CPF repetido é bloqueado', () => {
  const r = adicionarColaborador(COLABORADORES, { ...valido(), cpf: '12345678909' });
  assert.equal(r.ok, false);
  assert.match(r.erros.cpf, /Já existe/);
});

test('editar altera só o colaborador escolhido', () => {
  const r = editarColaborador(COLABORADORES, 1, { ...COLABORADORES[0], salario: 2600 });
  assert.equal(r.ok, true);
  assert.equal(r.lista.find((c) => c.id === 1).salario, 2600);
  assert.equal(r.lista.find((c) => c.id === 2).salario, 3800);
  assert.equal(COLABORADORES[0].salario, 2400); // original intacto
});

test('editar mantendo o próprio CPF não acusa duplicidade', () => {
  const r = editarColaborador(COLABORADORES, 1, { ...COLABORADORES[0], cargo: 'Motorista sênior' });
  assert.equal(r.ok, true);
});

test('editar para o CPF de outra pessoa é bloqueado', () => {
  const r = editarColaborador(COLABORADORES, 1, { ...COLABORADORES[0], cpf: '11144477735' });
  assert.equal(r.ok, false);
  assert.ok(r.erros.cpf);
});

test('editar id inexistente devolve erro', () => {
  assert.equal(editarColaborador(COLABORADORES, 99, valido()).ok, false);
});

test('remover tira só o colaborador indicado', () => {
  const lista = removerColaborador(COLABORADORES, 2);
  assert.equal(lista.length, 3);
  assert.ok(!lista.some((c) => c.id === 2));
  assert.equal(COLABORADORES.length, 4);
});

test('proximoId funciona com lista vazia', () => {
  assert.equal(proximoId([]), 1);
});

/* ----- Persistência ----- */
test('dados de demonstração são todos válidos', () => {
  let acumulada = [];
  for (const c of COLABORADORES) {
    const r = adicionarColaborador(acumulada, c);
    assert.equal(r.ok, true, `${c.nome}: ${JSON.stringify(r.erros)}`);
    acumulada = r.lista;
  }
});

test('carregar: sem dados salvos usa a demonstração (cópia independente)', () => {
  const r = carregarColaboradores(null, COLABORADORES);
  assert.equal(r.length, 4);
  r[0].nome = 'Alterado';
  assert.equal(COLABORADORES[0].nome, 'Carlos Henrique Sousa');
});

test('carregar: dados corrompidos viram a demonstração', () => {
  assert.equal(carregarColaboradores('lixo', COLABORADORES).length, 4);
  assert.equal(carregarColaboradores({ a: 1 }, COLABORADORES).length, 4);
});

test('carregar: descarta só os itens inválidos', () => {
  const salvo = [COLABORADORES[0], { id: 9, nome: 'x' }, null, COLABORADORES[1]];
  const r = carregarColaboradores(salvo, COLABORADORES);
  assert.deepEqual(r.map((c) => c.id), [1, 2]);
});

test('carregar: lista vazia salva continua vazia (usuário apagou tudo)', () => {
  assert.deepEqual(carregarColaboradores([], COLABORADORES), []);
});

test('carregar: CPF duplicado salvo é descartado', () => {
  const salvo = [COLABORADORES[0], { ...COLABORADORES[1], cpf: COLABORADORES[0].cpf }];
  assert.equal(carregarColaboradores(salvo, COLABORADORES).length, 1);
});

/* ----- Consultas e folha ----- */
test('desligados saem do quadro (portal e férias)', () => {
  const lista = [{ id: 1, situacao: 'ativo' }, { id: 2, situacao: 'afastado' }, { id: 3, situacao: 'desligado' }];
  assert.deepEqual(emQuadro(lista).map((c) => c.id), [1, 2]);
});

test('filtro ignora acentos e maiúsculas e busca em nome, cargo e cidade', () => {
  assert.equal(filtrarColaboradores(COLABORADORES, { texto: 'GRACAS' }).length, 1);
  assert.equal(filtrarColaboradores(COLABORADORES, { texto: 'picos' }).length, 2);
  assert.equal(filtrarColaboradores(COLABORADORES, { texto: 'motorista' }).length, 1);
  assert.equal(filtrarColaboradores(COLABORADORES, { texto: '', situacao: 'afastado' }).length, 0);
  assert.equal(filtrarColaboradores(COLABORADORES, { texto: 'zzz' }).length, 0);
});

test('custo do colaborador cadastrado bate com o simulador (auxiliar: R$ 3.431,70)', () => {
  const ana = COLABORADORES.find((c) => c.id === 4);
  assert.equal(custoDoColaborador(ana).totalMensal, 3431.7);
});

test('resumo da folha soma só os ativos e agrupa por cidade', () => {
  const base = { salario: 2000, valeTransporte: 0, valeRefeicao: 0, planoSaude: 0 };
  const lista = [
    { ...base, cidade: 'Picos', situacao: 'ativo' },
    { ...base, cidade: 'Picos', situacao: 'ativo' },
    { ...base, cidade: 'Teresina', situacao: 'ativo' },
    { ...base, cidade: 'Picos', situacao: 'desligado' },
    { ...base, cidade: 'Picos', situacao: 'afastado' },
  ];
  const r = resumoFolha(lista);
  assert.equal(r.ativos, 3);
  assert.equal(r.totalMensal, 9732.33); // 3 x 3.244,11
  assert.equal(r.totalAnual, 116787.96);
  assert.deepEqual(r.porCidade.map((c) => [c.cidade, c.quantidade, c.totalMensal]),
    [['Picos', 2, 6488.22], ['Teresina', 1, 3244.11]]);
});

test('resumo da folha com lista vazia', () => {
  const r = resumoFolha([]);
  assert.equal(r.ativos, 0);
  assert.equal(r.totalMensal, 0);
  assert.deepEqual(r.porCidade, []);
});
