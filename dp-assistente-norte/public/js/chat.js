// Agente de IA simulado: busca nos procedimentos da empresa e cita a fonte.
// Funciona offline. Pode ser trocado por uma API de IA mantendo a mesma assinatura.

export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pontuar(perguntaNormalizada, procedimento) {
  let pontos = 0;
  for (const palavra of procedimento.palavras) {
    const p = normalizar(palavra);
    if (p && perguntaNormalizada.includes(p)) {
      pontos += p.includes(' ') ? 3 : 2; // expressões valem mais
    }
  }
  if (perguntaNormalizada.includes(normalizar(procedimento.id))) pontos += 2;
  return pontos;
}

export function responder(pergunta, procedimentos) {
  const q = normalizar(pergunta);
  if (!q) {
    return { encontrado: false, texto: 'Digite sua dúvida sobre admissão, férias, folha, rescisão, eSocial ou FGTS.' };
  }
  let melhor = null;
  let melhorPontos = 0;
  for (const proc of procedimentos) {
    const pontos = pontuar(q, proc);
    if (pontos > melhorPontos) {
      melhor = proc;
      melhorPontos = pontos;
    }
  }
  if (!melhor) {
    return {
      encontrado: false,
      texto: 'Não encontrei um procedimento cadastrado sobre isso. Consulte o contador ou o responsável pelo DP e, se for uma rotina nova, cadastre o procedimento.',
    };
  }
  return {
    encontrado: true,
    procedimento: melhor,
    pontos: melhorPontos,
    texto: melhor.resumo,
    passos: melhor.passos,
    fonte: `Procedimento: ${melhor.titulo}`,
  };
}
