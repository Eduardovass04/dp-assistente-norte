import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, responder } from '../public/js/chat.js';
import { PROCEDIMENTOS } from '../public/js/dados.js';

test('normalizar remove acentos, pontuação e maiúsculas', () => {
  assert.equal(normalizar('  Admissão, do MOTORISTA?! '), 'admissao do motorista');
  assert.equal(normalizar(null), '');
});

test('pergunta sobre admissão de motorista aponta para o procedimento de admissão', () => {
  const r = responder('Quais documentos preciso para admitir um motorista?', PROCEDIMENTOS);
  assert.equal(r.encontrado, true);
  assert.equal(r.procedimento.id, 'admissao');
  assert.match(r.fonte, /Admissão/);
});

test('pergunta sobre FGTS aponta para o procedimento de FGTS', () => {
  const r = responder('Qual o prazo do FGTS este mês?', PROCEDIMENTOS);
  assert.equal(r.procedimento.id, 'fgts');
});

test('substituto consegue fechar a folha', () => {
  const r = responder('Como fecho a folha de pagamento?', PROCEDIMENTOS);
  assert.equal(r.procedimento.id, 'folha');
  assert.ok(r.passos.length >= 5);
});

test('perguntas sobre férias e rescisão', () => {
  assert.equal(responder('Como dar férias para um vendedor?', PROCEDIMENTOS).procedimento.id, 'ferias');
  assert.equal(responder('Preciso demitir um auxiliar, o que fazer?', PROCEDIMENTOS).procedimento.id, 'rescisao');
});

test('eSocial é encontrado mesmo com letras maiúsculas e acento', () => {
  assert.equal(responder('PRAZO DO ESOCIAL', PROCEDIMENTOS).procedimento.id, 'esocial');
});

test('pergunta fora do escopo não inventa resposta', () => {
  const r = responder('Qual o melhor time de futebol?', PROCEDIMENTOS);
  assert.equal(r.encontrado, false);
  assert.equal(r.procedimento, undefined);
  assert.match(r.texto, /contador/);
});

test('pergunta vazia orienta o usuário', () => {
  const r = responder('   ', PROCEDIMENTOS);
  assert.equal(r.encontrado, false);
});

test('todo procedimento tem os campos obrigatórios', () => {
  const ids = new Set();
  for (const p of PROCEDIMENTOS) {
    assert.ok(p.id && p.titulo && p.responsavel && p.prazo && p.resumo, `campos faltando em ${p.id}`);
    assert.ok(p.palavras.length > 0 && p.passos.length > 0);
    assert.ok(!ids.has(p.id), `id duplicado: ${p.id}`);
    ids.add(p.id);
  }
});
