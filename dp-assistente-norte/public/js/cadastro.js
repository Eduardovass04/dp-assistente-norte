// Cadastro de colaboradores: validação, regras e resumo da folha.
// Funções puras (não alteram a lista recebida), por isso são fáceis de testar.
// Cuidados com dados pessoais (LGPD): CPF mascarado na tela, coleta só do necessário,
// exclusão remove também os dados vinculados e nada sai do navegador.

import { parseData, formatarISO, diasEntre } from './prazos.js';
import { calcularCusto, arredondar } from './custo.js';

// Salário mínimo nacional de 2026 (Decreto 12.797/2025). Atualize a cada ano.
// Convenções coletivas e pisos regionais podem exigir valor maior.
export const SALARIO_MINIMO = 1621;
export const SITUACOES = ['ativo', 'afastado', 'desligado'];
export const ROTULO_SITUACAO = { ativo: 'Ativo', afastado: 'Afastado', desligado: 'Desligado' };
const DATA_MINIMA = '2000-01-01';
const DIAS_FUTURO_MAX = 60; // admissão pode ser pré-cadastrada (o eSocial é enviado antes do 1º dia)

/* ---------- CPF ---------- */
export const somenteDigitos = (t) => String(t ?? '').replace(/\D/g, '');

export function cpfValido(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

// Formata enquanto a pessoa digita: 123.456.789-09
export function formatarCPF(cpf) {
  const d = somenteDigitos(cpf).slice(0, 11);
  const partes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
  let t = partes.join('.');
  if (d.length > 9) t += '-' + d.slice(9);
  return t;
}

// Exibição segura na lista: ***.456.789-**
export function mascararCPF(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11) return '***.***.***-**';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/* ---------- Validação ---------- */
const limparTexto = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
const numero = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));

function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto))) return false;
  return formatarISO(parseData(texto)) === texto; // rejeita 2026-02-31
}

// opcoes: { lista (para checar CPF repetido), idAtual (na edição), hoje (Date; omita para não checar futuro) }
export function validarColaborador(dados, opcoes = {}) {
  const { lista = [], idAtual = null, hoje = null } = opcoes;
  const erros = {};
  const d = dados ?? {};

  const nome = limparTexto(d.nome);
  if (nome.length < 5 || !nome.includes(' ')) erros.nome = 'Informe o nome completo (nome e sobrenome).';
  else if (nome.length > 80) erros.nome = 'O nome pode ter no máximo 80 caracteres.';
  else if (/[0-9<>]/.test(nome)) erros.nome = 'O nome não pode ter números nem símbolos.';

  const cpf = somenteDigitos(d.cpf);
  if (!cpf) erros.cpf = 'Informe o CPF.';
  else if (!cpfValido(cpf)) erros.cpf = 'CPF inválido. Confira os 11 dígitos.';
  else if (lista.some((c) => c.id !== idAtual && c.cpf === cpf)) erros.cpf = 'Já existe um colaborador com este CPF.';

  const cargo = limparTexto(d.cargo);
  if (cargo.length < 3) erros.cargo = 'Informe o cargo.';
  else if (cargo.length > 50) erros.cargo = 'O cargo pode ter no máximo 50 caracteres.';

  const cidade = limparTexto(d.cidade);
  if (cidade.length < 2) erros.cidade = 'Informe a cidade de lotação.';
  else if (cidade.length > 50) erros.cidade = 'A cidade pode ter no máximo 50 caracteres.';

  if (!dataValida(d.admissao)) erros.admissao = 'Informe uma data de admissão válida.';
  else if (d.admissao < DATA_MINIMA) erros.admissao = 'Data de admissão anterior a 2000 não é aceita.';
  else if (hoje && diasEntre(hoje, parseData(d.admissao)) > DIAS_FUTURO_MAX) {
    erros.admissao = `A admissão não pode ser mais de ${DIAS_FUTURO_MAX} dias no futuro.`;
  }

  const salario = Number(d.salario);
  if (!Number.isFinite(salario) || d.salario === '' || d.salario === null) erros.salario = 'Informe o salário.';
  else if (salario < SALARIO_MINIMO) erros.salario = `O salário não pode ser menor que o mínimo nacional (R$ ${SALARIO_MINIMO.toLocaleString('pt-BR')}).`;
  else if (salario > 1000000) erros.salario = 'Salário acima do limite aceito.';

  for (const [campo, rotulo] of [['valeTransporte', 'vale-transporte'], ['valeRefeicao', 'vale-refeição'], ['planoSaude', 'plano de saúde']]) {
    const v = numero(d[campo]);
    if (!Number.isFinite(v) || v < 0) erros[campo] = `Valor inválido para ${rotulo}.`;
  }

  const situacao = d.situacao ?? 'ativo';
  if (!SITUACOES.includes(situacao)) erros.situacao = 'Situação inválida.';

  let feriasPendentesDesde = d.feriasPendentesDesde || null;
  if (feriasPendentesDesde) {
    if (!dataValida(feriasPendentesDesde)) erros.feriasPendentesDesde = 'Data inválida.';
    else if (!erros.admissao && feriasPendentesDesde < d.admissao) {
      erros.feriasPendentesDesde = 'Não pode ser anterior à data de admissão.';
    }
  }

  if (Object.keys(erros).length) return { ok: false, erros };

  return {
    ok: true,
    erros: {},
    valores: {
      nome, cpf, cargo, cidade,
      admissao: d.admissao,
      salario: arredondar(salario),
      valeTransporte: arredondar(numero(d.valeTransporte)),
      valeRefeicao: arredondar(numero(d.valeRefeicao)),
      planoSaude: arredondar(numero(d.planoSaude)),
      situacao,
      feriasPendentesDesde,
    },
  };
}

/* ---------- Operações (devolvem uma lista nova) ---------- */
export function proximoId(lista) {
  return lista.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
}

export function adicionarColaborador(lista, dados, opcoes = {}) {
  const r = validarColaborador(dados, { ...opcoes, lista });
  if (!r.ok) return { ok: false, erros: r.erros, lista };
  const colaborador = { id: proximoId(lista), ...r.valores };
  return { ok: true, erros: {}, lista: [...lista, colaborador], colaborador };
}

export function editarColaborador(lista, id, dados, opcoes = {}) {
  if (!lista.some((c) => c.id === id)) return { ok: false, erros: { geral: 'Colaborador não encontrado.' }, lista };
  const r = validarColaborador(dados, { ...opcoes, lista, idAtual: id });
  if (!r.ok) return { ok: false, erros: r.erros, lista };
  const colaborador = { id, ...r.valores };
  return { ok: true, erros: {}, lista: lista.map((c) => (c.id === id ? colaborador : c)), colaborador };
}

export function removerColaborador(lista, id) {
  return lista.filter((c) => c.id !== id);
}

// Lê o que estava salvo no navegador. Se vier algo estragado, descarta só o que for inválido.
export function carregarColaboradores(valorSalvo, padrao) {
  if (!Array.isArray(valorSalvo)) return padrao.map((c) => ({ ...c }));
  const resultado = [];
  for (const item of valorSalvo) {
    const r = validarColaborador(item, { lista: resultado, idAtual: item?.id });
    if (r.ok && Number.isFinite(Number(item.id))) resultado.push({ id: Number(item.id), ...r.valores });
  }
  return resultado;
}

/* ---------- Consultas ---------- */
// Quem faz parte do quadro (usado no portal e no controle de férias).
export const emQuadro = (lista) => lista.filter((c) => c.situacao !== 'desligado');

export function filtrarColaboradores(lista, { texto = '', situacao = 'todas' } = {}) {
  const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const busca = norm(texto.trim());
  return lista.filter((c) => {
    if (situacao !== 'todas' && c.situacao !== situacao) return false;
    if (!busca) return true;
    return norm(`${c.nome} ${c.cargo} ${c.cidade}`).includes(busca);
  });
}

export function custoDoColaborador(c, parametros = {}) {
  return calcularCusto(
    { salario: c.salario, valeTransporte: c.valeTransporte, valeRefeicao: c.valeRefeicao, planoSaude: c.planoSaude },
    parametros
  );
}

// Custo mensal da folha de quem está ATIVO, total e por cidade.
export function resumoFolha(lista, parametros = {}) {
  const ativos = lista.filter((c) => c.situacao === 'ativo');
  const porCidade = new Map();
  let totalMensal = 0;
  for (const c of ativos) {
    const custo = custoDoColaborador(c, parametros).totalMensal;
    totalMensal += custo;
    const atual = porCidade.get(c.cidade) ?? { cidade: c.cidade, quantidade: 0, totalMensal: 0 };
    atual.quantidade += 1;
    atual.totalMensal = arredondar(atual.totalMensal + custo);
    porCidade.set(c.cidade, atual);
  }
  totalMensal = arredondar(totalMensal);
  return {
    ativos: ativos.length,
    totalMensal,
    totalAnual: arredondar(totalMensal * 12),
    porCidade: [...porCidade.values()].sort((a, b) => b.totalMensal - a.totalMensal),
  };
}
