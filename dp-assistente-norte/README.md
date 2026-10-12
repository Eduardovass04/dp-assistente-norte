# DP Assistente Norte

Protótipo do **DP Assistente**, solução tecnológica para o **Problema 2 (Departamento Pessoal)** do Grupo Norte Alimentos S.A.
Atividade de Contabilidade Geral, Bacharelado em Sistemas de Informação, UFPI (CSHNB).

> Dados fictícios. Protótipo acadêmico: confira prazos, alíquotas e regras na legislação vigente antes de qualquer uso real.

## O problema

Rotinas do DP dependem de poucas pessoas, sem procedimentos escritos nem substitutos treinados; a comunicação acontece por aplicativos de mensagens, com arquivos em várias versões; e a expansão para novas cidades aumenta admissões e equipes em rota.

## Funcionalidades (a a e do enunciado)

| Funcionalidade | Onde está |
|---|---|
| a) Passo a passo de cada rotina (admissão, férias, folha, rescisão, eSocial, FGTS) | aba **Procedimentos** (com checklist) |
| b) Agente de IA que responde com base nos procedimentos | aba **Assistente** (simulado, funciona offline, cita a fonte) |
| c) Calendário com alertas de folha, FGTS, eSocial e férias | aba **Prazos e férias** |
| d) Portal do colaborador (holerite, férias, atestados) | aba **Portal do colaborador** |
| e) Projeção do custo de cada contratação | aba **Custo de contratação** |

## Como rodar

Requisito: [Node.js](https://nodejs.org) 18 ou superior. Não há dependências para instalar.

```bash
npm start
```

Abra http://localhost:3000. Para usar outra porta: `PORT=4000 npm start`.

## Como testar

```bash
npm test
```

| Arquivo | O que verifica |
|---|---|
| `test/custo.test.js` | encargos, provisões de 13º e férias, vale-transporte, validações, lançamento contábil |
| `test/chat.test.js` | normalização de texto, escolha do procedimento certo, pergunta fora do escopo |
| `test/prazos.test.js` | 5º dia útil, antecipação em fim de semana e feriado, virada de mês e ano, status das férias |
| `test/servidor.test.js` | página inicial, tipos de arquivo, 404 e bloqueio de acesso fora da pasta `public` |

## Estrutura

```
dp-assistente-norte/
├── server.js            servidor estático (sem dependências)
├── package.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── app.js       telas e interação
│       ├── dados.js     procedimentos e colaboradores fictícios
│       ├── chat.js      agente simulado
│       ├── custo.js     custo de contratação e lançamento contábil
│       └── prazos.js    prazos e férias
└── test/
```

## Cálculo do custo de contratação

Premissas para empresa no Lucro Presumido, sem desoneração da folha (editáveis em `public/js/custo.js`):

- INSS patronal 20%, RAT 2%, terceiros 5,8% e FGTS 8% (total de 35,8% sobre o salário);
- provisão de 13º (1/12) e de férias com 1/3 (1/12 x 4/3), com os mesmos encargos incidindo sobre elas;
- vale-transporte: a empresa arca com o que exceder 6% do salário;
- opcional: provisão da multa de 40% do FGTS.

Exemplo: salário de R$ 2.000,00 resulta em custo mensal de **R$ 3.244,11** (62,2% acima do salário).

Lançamento contábil da provisão mensal: **D** Despesa com férias e 13º (e encargos) / **C** Provisões trabalhistas (Passivo Circulante).

## Limitações e próximos passos

- O agente de IA é simulado (busca por palavras-chave). Pode ser trocado por uma API de IA mantendo a função `responder` de `chat.js`.
- Os dados ficam no navegador (`localStorage`); um sistema real precisaria de banco de dados, autenticação e conformidade com a LGPD.
- Os prazos usam dias fixos configuráveis e consideram apenas feriados informados; não há integração real com o eSocial.
