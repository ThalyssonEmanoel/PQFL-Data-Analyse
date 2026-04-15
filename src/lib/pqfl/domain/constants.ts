import type { BPACategoryKey, BPACategoryWeight } from "@/lib/pqfl/domain/types";

export const BPA_CATEGORIES: ReadonlyArray<BPACategoryWeight> = [
  { key: "gestaoPropriedade", label: "Gestão da propriedade", weight: 10 },
  { key: "manejoSanitario", label: "Manejo sanitário", weight: 20 },
  {
    key: "manejoOrdenhaPosOrdenha",
    label: "Manejo de ordenha e pós-ordenha",
    weight: 20,
  },
  {
    key: "refrigeracaoEstocagemLeite",
    label: "Refrigeração e estocagem do leite",
    weight: 15,
  },
  {
    key: "manejoAlimentarArmazenamento",
    label: "Manejo alimentar e armazenamento de alimentos",
    weight: 10,
  },
  { key: "qualidadeAgua", label: "Qualidade da água", weight: 8 },
  {
    key: "usoRacionalQuimicos",
    label: "Uso racional e estocagem de produtos químicos",
    weight: 6,
  },
  { key: "manejoResiduos", label: "Manejo de resíduos", weight: 5 },
  { key: "manutencaoPreventiva", label: "Manutenção preventiva", weight: 3 },
  {
    key: "capacitacaoControlePragas",
    label: "Capacitação e controle de pragas",
    weight: 3,
  },
] as const;

export const DEFAULT_CATEGORY_FIELD_HINTS: Record<BPACategoryKey, string[]> = {
  gestaoPropriedade: [
    "gestao",
    "propriedade",
    "registro",
    "anotacao",
    "controle",
    "financeiro",
    "zootecnico",
    "assistencia",
    "sucessao",
    "renda",
  ],
  manejoSanitario: [
    "sanitario",
    "vacin",
    "brucelose",
    "tuberculose",
    "mastite",
    "curaumbigo",
    "doente",
    "tratamento",
    "medicament",
    "cultura",
    "carrapato",
    "colostro",
  ],
  manejoOrdenhaPosOrdenha: [
    "ordenha",
    "predipping",
    "posdipping",
    "cmt",
    "caneca",
    "toalha",
    "tetos",
    "linhaordenha",
    "colostral",
  ],
  refrigeracaoEstocagemLeite: [
    "tanque",
    "refriger",
    "resfri",
    "temperatura",
    "estocagem",
    "acessoaotanque",
    "capacidadedotanque",
  ],
  manejoAlimentarArmazenamento: [
    "aliment",
    "volumoso",
    "silagem",
    "feno",
    "racao",
    "cocho",
    "pastejo",
    "insumo",
    "estoque",
    "aquisicao",
  ],
  qualidadeAgua: [
    "agua",
    "potavel",
    "potabilidade",
    "reservatorio",
    "captacao",
    "cloro",
    "higienizado",
  ],
  usoRacionalQuimicos: [
    "defensivo",
    "veterinario",
    "carencia",
    "agronomico",
    "farmacia",
    "armazenamentodosdefensivos",
    "usoquimico",
  ],
  manejoResiduos: [
    "dejeto",
    "destinacao",
    "descarte",
    "efluente",
    "residuoinadequado",
    "fertilizacao",
  ],
  manutencaoPreventiva: [
    "manutencao",
    "equipamento",
    "ordenhadeira",
    "veterinario",
    "agricola",
    "cronograma",
    "registrodasmanutencoes",
  ],
  capacitacaoControlePragas: [
    "treinamento",
    "capacit",
    "pragas",
    "controledepragas",
    "registrodetreinamentos",
    "bemestaranimal",
  ],
};

export const DEFAULT_CPP_FIELD_HINTS = [
  "cpp",
  "cppultimaanalise",
  "contagempadrao",
];

export const DEFAULT_RESIDUE_FIELD_HINTS = [
  "presencaresiduo",
  "residuosmedicamentosnoleite",
  "residuoleite",
  "resultadoresiduo",
  "antibiotico",
  "inibidor",
];

export const DEFAULT_ID_FIELD_HINTS = [
  "__metaFriendlyId",
  "__metaUserId",
  "idprodutor",
  "id_do_produtor",
  "idfornecedor",
  "producerid",
  "fornecedorid",
  "userId",
  "friendlyId",
  "id",
  "friendlyid",
  "cpf",
  "codigo",
];

export const DEFAULT_NAME_FIELD_HINTS = [
  "nome350925",
  "nome842334",
  "nomeprodutor",
  "nome_do_produtor",
  "nome",
  "name",
  "produtor",
  "fornecedor",
  "propriedade",
  "fazenda",
  "sitio",
  "chacara",
  "nomedapropriedade",
  "razaosocial",
  "fantasia",
];

export interface OfficialFactorFieldDefinition {
  keys: string[];
  label: string;
}

export const OFFICIAL_FACTOR_FIELDS: Record<BPACategoryKey, OfficialFactorFieldDefinition[]> = {
  gestaoPropriedade: [
    {
      keys: ["possuiEnergiaEletrica842360", "energia_eletrica"],
      label: "Possui energia elétrica",
    },
    {
      keys: ["aEnergiaEletricaEEstavelAMaiorParteDoTempo842361", "energia_estavel"],
      label: "Energia elétrica estável",
    },
    {
      keys: ["possuiAcessoAInternet842362", "internet"],
      label: "Possui acesso à internet",
    },
    {
      keys: ["oLeiteEAPrincipalAtividadeDaPropriedade842370", "leite_atividade_principal"],
      label: "Leite é atividade principal",
    },
  ],
  manejoSanitario: [
    {
      keys: ["possuiCalendarioSanitarioVacinacoesEndoEEctoparasitasEtc842452", "calendario_sanitario"],
      label: "Possui calendário sanitário",
    },
    {
      keys: ["realizaExameDeBruceloseETuberculoseAnualmente842453", "exames_anuais"],
      label: "Realiza exames anuais",
    },
    {
      keys: ["haProcedimentoImplantadoParaOColostroDasBezerras842455", "procedimento_colostro"],
      label: "Procedimento para colostro",
    },
    {
      keys: ["existeOControleDeAnimaisDoentesEProtocoloBemDefinidoParaTratamentoDasMastitesClinicas842457", "controle_mastite"],
      label: "Controle de mastite",
    },
    {
      keys: ["eRealizadoCulturaMicrobiologicaDasVacasEmLactacaoComMastite842458", "cultura_mastite"],
      label: "Cultura microbiológica",
    },
  ],
  manejoOrdenhaPosOrdenha: [
    {
      keys: ["eAdotadaLinhaDeOrdenhaexAnimaisSaudaveisPrimeiro842430", "linha_ordenha"],
      label: "Linha de ordenha",
    },
    {
      keys: ["asVacasSaoAlimentadasAposAOrdenha842436", "alimenta_apos_ordenha"],
      label: "Alimenta após ordenha",
    },
    {
      keys: ["utilizaPre_dippingAntesDaOrdenha842439", "pre_dipping"],
      label: "Utiliza pre-dipping",
    },
    {
      keys: ["utilizaSolucaoPos_dippingAposAOrdenha842440", "pos_dipping"],
      label: "Utiliza pos-dipping",
    },
  ],
  refrigeracaoEstocagemLeite: [
    {
      keys: ["oTanquePossuiCapacidadeProporcionalAoVolumeDeProducao842416", "tanque_proporcional"],
      label: "Tanque proporcional à produção",
    },
    {
      keys: ["existeAlgumControleDaTemperaturaAnotacoesDoTanqueDeExpansao842417", "controle_temperatura"],
      label: "Controle de temperatura do tanque",
    },
  ],
  manejoAlimentarArmazenamento: [
    {
      keys: ["entravistadorPossuiVolumosoEmQuantidadeSuficienteParaORebanhoOAnoTodo842464", "volumoso_suficiente"],
      label: "Volumoso suficiente",
    },
    {
      keys: ["entrevistadorOsAlimentosRacaoVolumosoESalSaoArmazenadosDeFormaAdequada842468", "armazenamento_adequado"],
      label: "Armazenamento adequado de alimentos",
    },
    {
      keys: ["realizaAnaliseDeSoloAoMenosUmaVezAoAno842469", "analise_solo"],
      label: "Análise de solo anual",
    },
    {
      keys: ["existeAlgumaDiferenciacaoDePastejoOuDietaDeAcordoComFaseDeLactacao842471", "dieta_fase_lactacao"],
      label: "Dieta por fase de lactação",
    },
  ],
  qualidadeAgua: [
    {
      keys: ["entrevistadorDeModoGeralAsInstalacoesDaPropriedadeGarantemOBem_estarAnimalSombraAlimentoDisponibilidadeDeAgua842486", "bem_estar_geral"],
      label: "Bem-estar geral com água disponível",
    },
  ],
  usoRacionalQuimicos: [
    {
      keys: ["haRegistroDeAplicacaoDeDefensivosReceituariosAgronomicos842473", "registro_defensivos"],
      label: "Registro de defensivos",
    },
    {
      keys: ["saoRespeitadosOPeriodoDeCarenciaDosProdutosConformeRecomendacaoTecnica842477", "carencia_respeitada"],
      label: "Respeita período de carência",
    },
  ],
  manejoResiduos: [
    {
      keys: ["existeProcedimentosDescritosParaODescarteDoLeiteInadequadoParaConsumo842481", "descarte_leite"],
      label: "Procedimento de descarte de leite inadequado",
    },
  ],
  manutencaoPreventiva: [
    {
      keys: ["entrevistadorOAmbienteDeTrabalhoELimpoEOrganizado842482", "ambiente_limpo"],
      label: "Ambiente de trabalho limpo",
    },
    {
      keys: ["entrevistadorAsInstalacoesDaPropriedadeGarantemBem_estarAnimal842483", "instalacoes_bem_estar"],
      label: "Instalações adequadas ao bem-estar",
    },
  ],
  capacitacaoControlePragas: [
    {
      keys: ["asPessoasEnvolvidasNaAtividadeLeiteiraPassamPorTreinamentosPeriodicos842461", "treinamentos_periodicos"],
      label: "Treinamentos periódicos",
    },
    {
      keys: ["haRegistroDeTreinamentosRealizadosSobreOManejoRacionalVisandoBem_estarAnimal842487", "registro_bem_estar"],
      label: "Registro de treinamentos",
    },
  ],
};

export const PBPA_ACTIONS_BY_CATEGORY: Record<BPACategoryKey, string[]> = {
  gestaoPropriedade: [
    "Atualizar diagnóstico anual e revisar plano de ação da propriedade.",
    "Registrar orientações de campo e acompanhar evolução da categoria.",
  ],
  manejoSanitario: [
    "Regularizar calendário sanitário e exames obrigatórios.",
    "Ajustar protocolo de mastite e manejo de animais doentes com visita técnica.",
  ],
  manejoOrdenhaPosOrdenha: [
    "Padronizar rotina de ordenha, pre-dipping e pos-dipping.",
    "Registrar evidências das melhorias aplicadas no manejo de ordenha.",
  ],
  refrigeracaoEstocagemLeite: [
    "Verificar capacidade do tanque e rotina de controle de temperatura.",
    "Aplicar checklist diário de refrigeração para reduzir não conformidades.",
  ],
  manejoAlimentarArmazenamento: [
    "Ajustar planejamento alimentar e armazenamento de insumos.",
    "Orientar dieta por fase de lactação e disponibilidade de volumoso.",
  ],
  qualidadeAgua: [
    "Avaliar disponibilidade e qualidade da água utilizada no processo.",
    "Corrigir pontos críticos de abastecimento com monitoramento técnico.",
  ],
  usoRacionalQuimicos: [
    "Regularizar uso, estocagem e rastreabilidade de produtos químicos.",
    "Reforçar período de carência e registro de aplicações.",
  ],
  manejoResiduos: [
    "Implementar rotina formal para manejo de resíduos e descarte adequado.",
    "Registrar ação corretiva e verificar aderência no próximo ciclo.",
  ],
  manutencaoPreventiva: [
    "Executar manutenção preventiva e calibragem de equipamentos.",
    "Criar checklist periódico com responsável definido na propriedade.",
  ],
  capacitacaoControlePragas: [
    "Promover capacitação técnica com evidências de participação.",
    "Incluir controle integrado de pragas no roteiro de visitas.",
  ],
};

export const PAE_ACTIONS = {
  cpp: [
    "Realizar visita in loco e corrigir pontos críticos ligados à qualidade do leite.",
    "Registrar as ações em ficha de visita e acompanhar resultados laboratoriais.",
  ],
  residuos: [
    "Investigar origem do resíduo e corrigir procedimento imediatamente.",
    "Reforçar controle de tratamentos e período de carência antes da entrega.",
  ],
} as const;
