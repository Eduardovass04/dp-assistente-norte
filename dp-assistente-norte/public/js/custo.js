// Simulador de custo de contratação (empresa no Lucro Presumido, sem desoneração da folha).
// Percentuais são editáveis e devem ser conferidos conforme o enquadramento da empresa.

export const PARAMETROS = {
  inssPatronal: 0.2,
  rat: 0.02, // varia de 1% a 3% conforme o grau de risco (e FAP)
  terceiros: 0.058, // Sistema S e salário-educação (varia por atividade)
  fgts: 0.08,
  descontoVT: 0.06, // parcela do salário descontada do colaborador
  multaFgts: 0.4, // multa sobre o FGTS na dispensa sem justa causa
};

export const arredondar = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

export function calcularCusto(entrada, parametros = {}) {
  const {
    salario,
    valeTransporte = 0,
    valeRefeicao = 0,
    planoSaude = 0,
    outros = 0,
    incluirProvisaoRescisao = false,
  } = entrada ?? {};
  const p = { ...PARAMETROS, ...parametros };

  if (!Number.isFinite(salario) || salario <= 0) {
    throw new Error('Informe um salário maior que zero.');
  }
  for (const [nome, v] of Object.entries({ valeTransporte, valeRefeicao, planoSaude, outros })) {
    if (!Number.isFinite(v) || v < 0) throw new Error(`Valor inválido em ${nome}.`);
  }

  const aliquotaEncargos = p.inssPatronal + p.rat + p.terceiros + p.fgts;
  const encargosMensais = arredondar(salario * aliquotaEncargos);
  const provisao13 = arredondar(salario / 12);
  const provisaoFerias = arredondar((salario / 12) * (4 / 3)); // férias + 1/3
  const encargosSobreProvisoes = arredondar((provisao13 + provisaoFerias) * aliquotaEncargos);
  const provisaoRescisao = incluirProvisaoRescisao
    ? arredondar((salario + provisao13 + provisaoFerias) * p.fgts * p.multaFgts)
    : 0;
  const vtEmpresa = arredondar(Math.max(0, valeTransporte - salario * p.descontoVT));
  const beneficios = arredondar(vtEmpresa + valeRefeicao + planoSaude + outros);

  const totalMensal = arredondar(
    salario + encargosMensais + provisao13 + provisaoFerias + encargosSobreProvisoes + provisaoRescisao + beneficios
  );

  return {
    salario: arredondar(salario),
    aliquotaEncargos,
    encargosMensais,
    provisao13,
    provisaoFerias,
    encargosSobreProvisoes,
    provisaoRescisao,
    vtEmpresa,
    beneficios,
    totalMensal,
    totalAnual: arredondar(totalMensal * 12),
    percentualSobreSalario: arredondar(((totalMensal - salario) / salario) * 100),
  };
}

// Lançamento contábil sugerido para a provisão mensal (partidas dobradas).
export function lancamentoProvisoes(resultado) {
  const valor = arredondar(
    resultado.provisao13 + resultado.provisaoFerias + resultado.encargosSobreProvisoes
  );
  return {
    debito: 'Despesa com férias e 13º salário (e encargos)',
    credito: 'Provisões trabalhistas (Passivo Circulante)',
    valor,
  };
}
