// Dados FICTÍCIOS do Grupo Norte Alimentos S.A. Confira prazos e regras na legislação vigente.

export const PROCEDIMENTOS = [
  {
    id: 'admissao',
    titulo: 'Admissão de colaborador',
    palavras: ['admissao', 'admitir', 'contratar', 'contratacao', 'novo funcionario', 'novo colaborador', 'documentos', 'registro', 'cnh', 'motorista'],
    responsavel: 'Analista de DP',
    prazo: 'Registro no eSocial até o dia anterior ao início das atividades',
    resumo: 'Reúna os documentos, faça o exame admissional (ASO) antes do 1º dia e registre o evento S-2200 no eSocial até a véspera do início.',
    passos: [
      'Coletar documentos: RG, CPF, CTPS digital, título de eleitor, comprovante de residência, dados bancários e certidões de filhos.',
      'Para motoristas: conferir a CNH na categoria exigida e o exame toxicológico, obrigatório para motoristas profissionais.',
      'Agendar e receber o ASO (exame admissional) antes do início do trabalho.',
      'Cadastrar o colaborador no sistema (cargo, salário, jornada, cidade de lotação e rota).',
      'Transmitir o evento S-2200 no eSocial até o dia anterior ao início.',
      'Assinar o contrato de trabalho (e o de experiência, se for o caso).',
      'Cadastrar vale-transporte e vale-refeição e entregar EPIs e uniforme.',
      'Liberar o acesso do colaborador ao portal.',
    ],
  },
  {
    id: 'ferias',
    titulo: 'Concessão de férias',
    palavras: ['ferias', 'periodo aquisitivo', 'periodo concessivo', 'abono', 'descanso', 'tirar ferias'],
    responsavel: 'Analista de DP e gestor da equipe',
    prazo: 'Aviso com 30 dias de antecedência; pagamento até 2 dias antes do início',
    resumo: 'Avise o colaborador com 30 dias de antecedência e pague as férias com o adicional de 1/3 até 2 dias antes do início.',
    passos: [
      'Verificar o período aquisitivo (12 meses) e o prazo concessivo (mais 12 meses) para evitar o pagamento em dobro.',
      'Combinar as datas com o gestor, garantindo um substituto na rota ou no setor.',
      'Avisar o colaborador por escrito com pelo menos 30 dias de antecedência.',
      'Se houver fracionamento, conferir as regras: até 3 períodos, sendo um com no mínimo 14 dias e os demais com no mínimo 5 dias.',
      'Calcular férias + 1/3 constitucional (e abono pecuniário, se solicitado).',
      'Pagar até 2 dias antes do início e enviar o recibo ao colaborador.',
      'Lançar a informação na folha e no eSocial.',
    ],
  },
  {
    id: 'folha',
    titulo: 'Fechamento da folha de pagamento',
    palavras: ['folha', 'holerite', 'contracheque', 'salario', 'pagamento', 'fechar a folha', 'fechamento', 'comissao', 'hora extra'],
    responsavel: 'Analista de folha (substituto: assistente de DP)',
    prazo: 'Pagamento até o 5º dia útil do mês seguinte',
    resumo: 'Colete as variações do mês, calcule, confira e pague os salários até o 5º dia útil.',
    passos: [
      'Receber o fechamento do ponto e as variações: horas extras, faltas, comissões dos vendedores e adicionais.',
      'Conferir admissões, rescisões, férias e afastamentos do mês.',
      'Calcular a folha no sistema.',
      'Comparar os totais com o mês anterior e investigar variações acima de 10%.',
      'Obter a aprovação do gestor.',
      'Gerar e disponibilizar os holerites no portal do colaborador.',
      'Pagar os salários até o 5º dia útil.',
      'Enviar os eventos de folha ao eSocial e gerar as guias (FGTS e INSS).',
      'Enviar o resumo da folha à contabilidade para os lançamentos e as provisões.',
    ],
  },
  {
    id: 'rescisao',
    titulo: 'Rescisão de contrato',
    palavras: ['rescisao', 'demissao', 'demitir', 'desligamento', 'aviso previo', 'termo de rescisao', 'pedido de demissao', 'acerto'],
    responsavel: 'Analista de DP',
    prazo: 'Pagamento das verbas em até 10 dias corridos após o término do contrato',
    resumo: 'Defina o tipo de desligamento, realize o exame demissional, calcule as verbas e pague em até 10 dias corridos.',
    passos: [
      'Identificar o tipo de desligamento (sem justa causa, pedido de demissão, justa causa, acordo ou término de contrato).',
      'Definir o aviso prévio (trabalhado ou indenizado).',
      'Agendar o exame demissional (ASO).',
      'Calcular saldo de salário, férias vencidas e proporcionais + 1/3, 13º proporcional e a multa do FGTS, quando aplicável.',
      'Recolher equipamentos, EPIs e documentos da empresa.',
      'Pagar as verbas em até 10 dias corridos e colher a assinatura do termo de rescisão.',
      'Transmitir o evento S-2299 no eSocial.',
      'Informar a contabilidade para baixar as provisões de férias e 13º.',
    ],
  },
  {
    id: 'esocial',
    titulo: 'Obrigações do eSocial',
    palavras: ['esocial', 'evento', 'evento de folha', 's-2200', 's-1200', 's-2299', 'dctfweb', 'transmitir'],
    responsavel: 'Analista de DP',
    prazo: 'Eventos mensais de folha até o dia 15 do mês seguinte',
    resumo: 'Envie os eventos de admissão, folha, afastamento e desligamento nos prazos para evitar multas.',
    passos: [
      'Admissão (S-2200): até o dia anterior ao início das atividades.',
      'Folha de pagamento (S-1200 e S-1210): até o dia 15 do mês seguinte.',
      'Desligamento (S-2299): até 10 dias após o desligamento.',
      'Afastamentos e atestados: enviar nos prazos de cada evento.',
      'Conferir os retornos e corrigir inconsistências no mesmo dia.',
      'Fechar a competência e conferir a DCTFWeb.',
    ],
  },
  {
    id: 'fgts',
    titulo: 'Recolhimento do FGTS',
    palavras: ['fgts', 'guia do fgts', 'deposito do fgts', 'fgts digital', 'recolhimento'],
    responsavel: 'Analista de DP (substituto: contador)',
    prazo: 'Até o dia 20 do mês seguinte (antecipar se não for dia útil)',
    resumo: 'Gere a guia no FGTS Digital após o fechamento da folha e pague até o dia 20.',
    passos: [
      'Fechar a folha e os eventos do eSocial da competência.',
      'Gerar a guia no FGTS Digital (8% sobre a remuneração).',
      'Conferir o valor da guia com o relatório da folha.',
      'Pagar até o dia 20 (antecipando quando cair em dia não útil).',
      'Arquivar o comprovante e informar a contabilidade.',
    ],
  },
];

// Colaboradores fictícios para demonstração (CPFs de teste, sem relação com pessoas reais).
// Usados apenas na primeira abertura ou ao restaurar a demonstração.
export const COLABORADORES = [
  { id: 1, nome: 'Carlos Henrique Sousa', cpf: '12345678909', cargo: 'Motorista', cidade: 'Picos (PI)', admissao: '2025-03-10', salario: 2400, valeTransporte: 220, valeRefeicao: 400, planoSaude: 0, situacao: 'ativo', feriasPendentesDesde: null },
  { id: 2, nome: 'Maria das Graças Lima', cpf: '11144477735', cargo: 'Analista de folha', cidade: 'Teresina (PI)', admissao: '2024-02-05', salario: 3800, valeTransporte: 0, valeRefeicao: 400, planoSaude: 250, situacao: 'ativo', feriasPendentesDesde: '2025-02-05' },
  { id: 3, nome: 'José Ribeiro Neto', cpf: '39053344705', cargo: 'Vendedor em rota', cidade: 'Floriano (PI)', admissao: '2026-06-01', salario: 2100, valeTransporte: 0, valeRefeicao: 400, planoSaude: 0, situacao: 'ativo', feriasPendentesDesde: null },
  { id: 4, nome: 'Ana Beatriz Costa', cpf: '52998224725', cargo: 'Auxiliar de depósito', cidade: 'Picos (PI)', admissao: '2025-11-17', salario: 1800, valeTransporte: 220, valeRefeicao: 400, planoSaude: 0, situacao: 'ativo', feriasPendentesDesde: null },
];

// Holerite fictício: percentuais sobre o salário (apenas para demonstração)
export const HOLERITE_MODELO = {
  descontos: [
    ['INSS (estimativa)', 0.09],
    ['Vale-transporte (6%)', 0.06],
  ],
};
