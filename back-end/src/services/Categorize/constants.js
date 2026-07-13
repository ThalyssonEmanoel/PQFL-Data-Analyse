// ---------------------------------------------------------------------------
// Estrutura oficial do diagnostico PQFL (Manual PQFL / MAPA, IN 76 e 77).
//
// As 14 categorias abaixo correspondem aos itens I a XIV do checklist de
// diagnostico de situacao (back-end/docs/Anotacoes-5.md). Cada categoria reune
// as perguntas S/N/NA do checklist que possuem um campo correspondente no
// formulario Coletum "PQFL - LACMON" (form 26738).
//
// Pesos: proporcionais ao numero de perguntas com campo S/N por categoria,
// normalizados para somar 100. O peso efetivo usado no calculo e derivado em
// scoring.js a partir da contagem de OFFICIAL_FACTOR_FIELDS (garante soma 100
// mesmo que o mapeamento mude); os valores abaixo sao informativos.
//
// Perguntas do checklist SEM campo S/N no Coletum sao ignoradas no calculo e
// estao documentadas em back-end/docs/Anotacoes-5.md (secao "Campos ausentes").
// ---------------------------------------------------------------------------

export const BPA_CATEGORIES = [
  { key: "gestaoPropriedade", label: "Gestão da propriedade", weight: 19.35 },
  { key: "gestaoInsumos", label: "Gestão de insumos", weight: 3.23 },
  { key: "manejoSanitario", label: "Manejo sanitário", weight: 12.9 },
  {
    key: "manejoAlimentarArmazenamento",
    label: "Manejo alimentar e armazenamento de alimentos",
    weight: 12.9,
  },
  { key: "qualidadeAgua", label: "Qualidade da água", weight: 6.45 },
  {
    key: "higienePessoalSaude",
    label: "Higiene pessoal e saúde dos trabalhadores",
    weight: 3.23,
  },
  { key: "controleIntegradoPragas", label: "Controle integrado de pragas", weight: 1.61 },
  { key: "capacitacaoTrabalhadores", label: "Capacitação dos trabalhadores", weight: 3.23 },
  {
    key: "manejoOrdenhaPosOrdenha",
    label: "Manejo de ordenha e pós-ordenha",
    weight: 14.52,
  },
  {
    key: "refrigeracaoEstocagemLeite",
    label: "Refrigeração e estocagem do leite",
    weight: 4.84,
  },
  {
    key: "manejoResiduosDejetos",
    label: "Manejo de resíduos e tratamento de dejetos e efluentes",
    weight: 4.84,
  },
  {
    key: "usoRacionalQuimicos",
    label: "Uso racional e estocagem de produtos químicos, agentes tóxicos e medicamentos veterinários",
    weight: 6.45,
  },
  {
    key: "manutencaoPreventiva",
    label: "Manutenção preventiva e calibragem de equipamentos",
    weight: 3.23,
  },
  {
    key: "bemEstarAnimal",
    label: "Adoção de práticas de manejo racional e de bem-estar animal",
    weight: 3.23,
  },
];

export const DEFAULT_CATEGORY_FIELD_HINTS = {
  gestaoPropriedade: [
    "gestao",
    "propriedade",
    "registra",
    "anotacao",
    "controle",
    "financeiro",
    "zootecnico",
    "assistencia",
    "sucessao",
    "renda",
    "coberturas",
    "nascimento",
    "controleleiteiro",
  ],
  gestaoInsumos: ["insumo", "estoque", "aquisicao", "calendariodeaquisicao"],
  manejoSanitario: [
    "sanitario",
    "vacin",
    "brucelose",
    "tuberculose",
    "mastite",
    "curaumbigo",
    "colostro",
    "doente",
    "tratamento",
    "cultura",
    "carrapato",
  ],
  manejoAlimentarArmazenamento: [
    "aliment",
    "volumoso",
    "silagem",
    "feno",
    "racao",
    "cocho",
    "pastejo",
    "dieta",
    "analisedesolo",
    "correcaodosolo",
    "armazenados",
    "defensivos",
  ],
  qualidadeAgua: [
    "agua",
    "potavel",
    "potabilidade",
    "reservatorio",
    "captacao",
    "cloro",
    "higienizado",
    "tratamentodaagua",
  ],
  higienePessoalSaude: [
    "higienepessoal",
    "protecaoindividual",
    "epi",
    "sabao",
    "saudedostrabalhadores",
  ],
  controleIntegradoPragas: ["pragas", "controledepragas", "estrategiadecontrole"],
  capacitacaoTrabalhadores: ["treinamento", "capacit", "registrosdetreinamentos"],
  manejoOrdenhaPosOrdenha: [
    "ordenha",
    "predipping",
    "posdipping",
    "cmt",
    "caneca",
    "toalha",
    "tetos",
    "linhadeordenha",
    "colostral",
  ],
  refrigeracaoEstocagemLeite: [
    "tanque",
    "refriger",
    "resfri",
    "temperatura",
    "estocagem",
    "capacidadedotanque",
  ],
  manejoResiduosDejetos: [
    "dejeto",
    "destinacao",
    "descarte",
    "efluente",
    "esterco",
    "residuoinadequado",
    "fertilizacao",
  ],
  usoRacionalQuimicos: [
    "defensivo",
    "veterinario",
    "carencia",
    "agronomico",
    "agroquimico",
    "farmacia",
    "armazenamentodosdefensivos",
  ],
  manutencaoPreventiva: [
    "manutencao",
    "cronogramademanutencao",
    "registrodasmanutencoes",
    "calibragem",
  ],
  bemEstarAnimal: [
    "bemestar",
    "bemestaranimal",
    "manejoracional",
    "instalacoesgarantem",
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
  "problemascomresiduosdemedicamentos",
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

// ---------------------------------------------------------------------------
// Campos oficiais por categoria (OFFICIAL_FACTOR_FIELDS).
//
// Cada item mapeia uma pergunta do checklist para o campo S/N correspondente no
// Coletum (form 26738). `keys` lista candidatos: o id real do componente e um
// alias curto; o casamento e feito por token normalizado (vide scoring.js).
//
//   questionId    -> numeracao do checklist (Anotacoes-5.md)
//   imprescindivel -> item marcado como TIPO "I" (Imprescindivel) no Manual MAPA
//
// Somente perguntas com campo S/N entram aqui. Perguntas sem campo (ou com campo
// informativo/categorico) ficam de fora e estao listadas em Anotacoes-5.md.
// ---------------------------------------------------------------------------

export const OFFICIAL_FACTOR_FIELDS = {
  gestaoPropriedade: [
    {
      keys: ["_registra_receitas_e_despesas351997", "registra_receitas_despesas"],
      label: "1.1 Registra receitas e despesas?",
      questionId: "1.1",
      imprescindivel: false,
    },
    {
      keys: ["_analisa_dados_financeiros351998", "analisa_dados_financeiros"],
      label: "1.2 Analisa os dados financeiros?",
      questionId: "1.2",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador__as_racas_utilizadas_sao_compativeis_com_o_sistema_de_producao_leiteira351999",
        "racas_compativeis",
      ],
      label: "1.3 As raças utilizadas são compatíveis com o sistema de produção adotado?",
      questionId: "1.3",
      imprescindivel: false,
    },
    {
      keys: ["_registra_coberturas352000", "registra_coberturas"],
      label: "1.4 Registra coberturas?",
      questionId: "1.4",
      imprescindivel: true,
    },
    {
      keys: ["_registra_nascimento352001", "registra_nascimentos"],
      label: "1.5 Registra nascimentos?",
      questionId: "1.5",
      imprescindivel: false,
    },
    {
      keys: ["_pesa_os_animais_em_recria_femeas352002", "pesa_os_animais"],
      label: "1.6 Pesa os animais?",
      questionId: "1.6",
      imprescindivel: false,
    },
    {
      keys: ["_realiza_controle_leiteiro_ao_menos_uma_vez_ao_mes352003", "controle_leiteiro"],
      label: "1.7 Realiza controle leiteiro?",
      questionId: "1.7",
      imprescindivel: true,
    },
    {
      keys: [
        "_os_animais_sao_identificados_individualmente_brinco_colar_etc352004",
        "animais_identificados",
      ],
      label: "1.8 Os animais são identificados individualmente?",
      questionId: "1.8",
      imprescindivel: false,
    },
    {
      keys: [
        "_realiza_as_anotacoes_de_secagem_de_vacas_descarte_morte_compra_de_animais352006",
        "anotacoes_secagem_descarte",
      ],
      label: "1.9 Realiza as anotações de secagem de vacas, descarte, morte, compra de animais?",
      questionId: "1.9",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_os_equipamentos_veterinarios_sao_mantidos_em_bom_estado_de_conservacao352048",
        "equipamentos_veterinarios_limpos",
      ],
      label: "1.10 Os equipamentos veterinários são mantidos limpos?",
      questionId: "1.10",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_os_equipamentos_agricolas_sao_mantidos_em_bom_estado_de_conservacao352049",
        "equipamentos_agricolas_limpos",
      ],
      label: "1.11 Os equipamentos agrícolas são mantidos limpos?",
      questionId: "1.11",
      imprescindivel: false,
    },
    {
      keys: ["_possui_assistencia_tecnica_regular_mensal_ou_bimestral352007", "assistencia_tecnica"],
      label: "1.12 Possui assistência técnica regular?",
      questionId: "1.12",
      imprescindivel: false,
    },
  ],
  gestaoInsumos: [
    {
      keys: ["_existe_controle_de_estoque_de_insumos352053", "controle_estoque_insumos"],
      label: "2.2 Existe controle de estoque de insumos?",
      questionId: "2.2",
      imprescindivel: false,
    },
    {
      keys: ["_existe_calendario_de_aquisicao_de_insumos352054", "calendario_aquisicao_insumos"],
      label: "2.3 Existe calendário de aquisição de insumos?",
      questionId: "2.3",
      imprescindivel: false,
    },
  ],
  manejoSanitario: [
    {
      keys: ["_realiza_exames_ao_adquirir_animais_de_outros_rebanhos352056", "exames_aquisicao_animais"],
      label: "3.1 Realiza exames para adquirir animais ou adquire de rebanho fechado?",
      questionId: "3.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_possui_calendario_sanitario_vacinacoes_endo_e_ectoparasitas_etc352057",
        "calendario_sanitario",
      ],
      label: "3.2 Possui calendário sanitário (Vacinações, Endo e Ectoparasitas)?",
      questionId: "3.2",
      imprescindivel: false,
    },
    {
      keys: ["_ha_procedimento_implantado_para_o_colostro_das_bezerras352060", "procedimento_colostro"],
      label: "3.3 Há procedimento implantado para o colostro dos bezerros?",
      questionId: "3.3",
      imprescindivel: true,
    },
    {
      keys: ["_realiza_a_cura_do_umbigo_das_bezerras352059", "cura_umbigo"],
      label: "3.4 Realiza a cura do umbigo dos bezerros na época correta?",
      questionId: "3.4",
      imprescindivel: false,
    },
    {
      keys: ["_realiza_exame_de_brucelose_e_tuberculose_anualmente352058", "exames_anuais"],
      label: "3.5 Realiza exame de Brucelose e Tuberculose anualmente?",
      questionId: "3.5",
      imprescindivel: false,
    },
    {
      keys: ["_ha_identificacao_de_animais_sob_tratamento352061", "identificacao_animais_tratamento"],
      label: "3.6 Há identificação de animais sob tratamento?",
      questionId: "3.6",
      imprescindivel: false,
    },
    {
      keys: [
        "_existe_o_controle_de_animais_doentes_e_protocolo_bem_definido_para_tratamento_das_mastites_clinicas352062",
        "controle_mastite",
      ],
      label: "3.7 Existe o controle de animais doentes e protocolo para tratamento das mastites clínicas?",
      questionId: "3.7",
      imprescindivel: false,
    },
    {
      keys: [
        "_e_realizado_cultura_microbiologica_das_vacas_em_lactacao_com_mastite352063",
        "cultura_microbiologica",
      ],
      label: "3.8 É realizada cultura microbiológica das vacas em lactação com mastite?",
      questionId: "3.8",
      imprescindivel: false,
    },
  ],
  manejoAlimentarArmazenamento: [
    {
      keys: [
        "_entravistador_possui_volumoso_em_quantidade_suficiente_para_o_rebanho_o_ano_todo352069",
        "volumoso_suficiente",
      ],
      label: "4.1 Possui volumoso em quantidade suficiente para o rebanho?",
      questionId: "4.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_existe_alguma_diferenciacao_de_pastejo_ou_dieta_de_acordo_com_fase_de_lactacao352076",
        "ajuste_dieta_rebanho",
      ],
      label: "4.2 Realiza um manejo alimentar com ajustes na dieta do rebanho?",
      questionId: "4.2",
      imprescindivel: false,
    },
    {
      keys: [
        "_os_animais_sao_separados_em_lotes_vacas_em_lactacao_vacas_secas_etc352005",
        "divisao_lotes_lactacao",
      ],
      label: "4.5 Há divisão dos lotes de vacas em lactação?",
      questionId: "4.5",
      imprescindivel: false,
    },
    {
      keys: [
        "_ha_registro_de_aplicacao_de_defensivos_receituarios_agronomicos352078",
        "registro_quimicos_pastagens",
      ],
      label: "4.8 Há registro da aplicação de químicos nas pastagens / forragens?",
      questionId: "4.8",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_os_alimentos_racao_volumoso_e_sal_sao_armazenados_de_forma_adequada352073",
        "alimentos_armazenados_adequados",
      ],
      label: "4.11 Os alimentos são armazenados de forma adequada?",
      questionId: "4.11",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_ha_area_especifica_e_com_restricao_de_acesso_para_o_armazenamento_dos_defensivos_e_produtos_veterinarios352080",
        "local_quimicos_agricolas",
      ],
      label: "4.12 Há local específico para o armazenamento de produtos químicos agrícolas?",
      questionId: "4.12",
      imprescindivel: false,
    },
    {
      keys: ["_realiza_analise_de_solo_ao_menos_uma_vez_ao_ano352074", "analise_solo"],
      label: "4.13 Realiza análise de solo?",
      questionId: "4.13",
      imprescindivel: false,
    },
    {
      keys: ["_faz_correcao_do_solo_de_acordo_com_analise352075", "adubacao_recomendacao"],
      label: "4.14 Realiza adubação de acordo com recomendações técnicas?",
      questionId: "4.14",
      imprescindivel: false,
    },
  ],
  qualidadeAgua: [
    {
      keys: [
        "_os_reservatorios_de_agua_sao_periodicamente_higienizados352028",
        "reservatorios_higienizados",
      ],
      label: "5.2 Os reservatórios de água são periodicamente higienizados?",
      questionId: "5.2",
      imprescindivel: false,
    },
    {
      keys: ["_a_agua_utilizada_na_limpeza_de_equipamentos_e_potavel352029", "agua_limpeza_potavel"],
      label: "5.4 A água utilizada na limpeza de equipamentos é potável?",
      questionId: "5.4",
      imprescindivel: false,
    },
    {
      keys: ["_ja_foi_realizada_analise_para_avaliar_a_qualidade_da_agua352030", "analise_qualidade_agua"],
      label: "5.5 São realizadas análises para avaliação da qualidade da água?",
      questionId: "5.5",
      imprescindivel: false,
    },
    {
      keys: ["_existe_algum_tratamento_da_agua_ex_cloro352031", "tratamento_agua"],
      label: "5.6 Existe algum tratamento da água?",
      questionId: "5.6",
      imprescindivel: false,
    },
  ],
  higienePessoalSaude: [
    {
      keys: [
        "_ha_disponibilidade_de_equipamentos_de_protecao_individual_epi352033",
        "epi_disponivel",
      ],
      label: "6.1 São disponibilizados equipamentos de proteção individual?",
      questionId: "6.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_existe_local_adequado_para_higiene_pessoal_com_fornecimento_de_agua_e_sabao352032",
        "local_higiene_pessoal",
      ],
      label: "6.2 Existe local adequado para a higiene pessoal com fornecimento de água e sabão?",
      questionId: "6.2",
      imprescindivel: false,
    },
  ],
  controleIntegradoPragas: [
    {
      keys: [
        "_existe_alguma_estrategia_de_controle_de_pragas_na_propriedade352082",
        "estrategia_controle_pragas",
      ],
      label: "7.1 Existe alguma estratégia de controle de pragas na propriedade?",
      questionId: "7.1",
      imprescindivel: false,
    },
  ],
  capacitacaoTrabalhadores: [
    {
      keys: [
        "_as_pessoas_envolvidas_na_atividade_leiteira_passam_por_treinamentos_periodicos352066",
        "treinamentos_periodicos",
      ],
      label: "8.1 Os funcionários da propriedade passam por treinamentos periódicos?",
      questionId: "8.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_ha_registros_de_treinamentos_realizados_fotos_listas_certificado_etc352067",
        "registros_treinamentos",
      ],
      label: "8.2 Há registros de treinamentos realizados?",
      questionId: "8.2",
      imprescindivel: true,
    },
  ],
  manejoOrdenhaPosOrdenha: [
    {
      keys: ["_e_adotada_linha_de_ordenhaex_animais_saudaveis_primeiro352036", "linha_ordenha"],
      label: "9.3 A propriedade adota linha de ordenha?",
      questionId: "9.3",
      imprescindivel: false,
    },
    {
      keys: ["_entrevistador_o_local_de_ordenha_e_mantido_limpo_e_organizado352037", "local_ordenha_limpo"],
      label: "9.4 O local de ordenha é mantido limpo?",
      questionId: "9.4",
      imprescindivel: false,
    },
    {
      keys: [
        "_ha_identificacao_de_animais_em_fase_colostral_recem_paridas352038",
        "identificacao_colostral",
      ],
      label: "9.5 Há identificação de animais em fase colostral?",
      questionId: "9.5",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_os_equipamentosutensilios_de_ordenha_sao_mantidos_em_boas_condicoes_de_limpeza352039",
        "equipamento_ordenha_limpo",
      ],
      label: "9.6 O equipamento de ordenha é mantido em boas condições de limpeza?",
      questionId: "9.6",
      imprescindivel: false,
    },
    {
      keys: [
        "_e_realizado_o_teste_da_caneca_de_fundo_preto_ou_telado_em_todas_as_vacas_em_lactacao352040",
        "teste_caneca_fundo_preto",
      ],
      label: "9.7 É realizado o teste da caneca de fundo preto em todos os animais?",
      questionId: "9.7",
      imprescindivel: false,
    },
    {
      keys: ["_e_realizado_o_teste_de_cmt_em_todas_as_vacas_em_lactacao352041", "teste_cmt"],
      label: "9.8 É realizado o teste de CMT nas vacas?",
      questionId: "9.8",
      imprescindivel: false,
    },
    {
      keys: ["_as_vacas_sao_alimentadas_apos_a_ordenha352042", "alimenta_apos_ordenha"],
      label: "9.10 As vacas são alimentadas após a ordenha?",
      questionId: "9.10",
      imprescindivel: false,
    },
    {
      keys: [
        "_as_vacas_em_tratamento_para_mastite_sao_ordenhadas_separadamente352043",
        "ordenha_separada_mastite",
      ],
      label: "9.11 As vacas em tratamento para mastite são ordenhadas separadamente?",
      questionId: "9.11",
      imprescindivel: false,
    },
    {
      keys: [
        "_e_realizado_cultura_microbiologica_das_vacas_em_lactacao_com_mastite352063",
        "cultura_antibiograma_mastite",
      ],
      label: "9.13 São coletadas amostras para cultura e antibiograma de vacas com mastite persistente?",
      questionId: "9.13",
      imprescindivel: false,
    },
  ],
  refrigeracaoEstocagemLeite: [
    {
      keys: [
        "_o_tanque_possui_capacidade_proporcional_ao_volume_de_producao352022",
        "tanque_proporcional",
      ],
      label: "10.1 O tanque de leite possui capacidade proporcional ao volume produção?",
      questionId: "10.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_o_local_onde_o_tanque_esta_e_adequado_cobertura_paredes_isolado_de_animais_possui_iluminacao_etc355059",
        "area_armazenamento_leite_limpa",
      ],
      label: "10.2 A área de armazenamento do leite é mantida limpa?",
      questionId: "10.2",
      imprescindivel: false,
    },
    {
      keys: [
        "_existe_algum_controle_da_temperatura_anotacoes_do_tanque_de_expansao352023",
        "controle_temperatura",
      ],
      label: "10.5 Existe algum controle da temperatura do tanque e do leite?",
      questionId: "10.5",
      imprescindivel: false,
    },
  ],
  manejoResiduosDejetos: [
    {
      keys: [
        "_entrevistador_o_manejo_de_destinacao_dos_dejetos_e_feito_adequadamente352083",
        "manejo_esterco_adequado",
      ],
      label: "11.1 O manejo de esterco é feito adequadamente?",
      questionId: "11.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_neste_caso_ha_tratamento_para_uso_na_fertilizacao_das_pastagens352084",
        "tratamento_efluentes",
      ],
      label: "11.2 Há tratamento de efluentes oriundos da ordenha?",
      questionId: "11.2",
      imprescindivel: false,
    },
    {
      keys: [
        "_existe_procedimentos_descritos_para_o_descarte_do_leite_inadequado_para_consumo352085",
        "descarte_leite_inadequado",
      ],
      label: "11.3 Existem procedimentos descritos para o descarte do leite inadequado para o consumo?",
      questionId: "11.3",
      imprescindivel: false,
    },
  ],
  usoRacionalQuimicos: [
    {
      keys: [
        "_ha_registro_de_treinamento_dos_trabalhadores_no_que_se_refere_ao_uso_de_defensivos_e_outros_produtos_de_uso_veterinario352079",
        "treinamento_uso_agroquimicos",
      ],
      label: "12.1 Há registro de treinamentos dos trabalhadores no que se refere ao uso de agroquímicos e produtos de uso veterinário?",
      questionId: "12.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_entrevistador_ha_area_especifica_e_com_restricao_de_acesso_para_o_armazenamento_dos_defensivos_e_produtos_veterinarios352080",
        "area_restrita_agroquimicos",
      ],
      label: "12.2 Há área específica e com restrição de acesso para o armazenamento dos agroquímicos e de produtos de uso veterinário?",
      questionId: "12.2",
      imprescindivel: false,
    },
    {
      keys: [
        "_ha_registro_de_aplicacao_de_defensivos_receituarios_agronomicos352078",
        "registro_aplicacao_agroquimicos",
      ],
      label: "12.3 Há registro da aplicação dos agroquímicos?",
      questionId: "12.3",
      imprescindivel: false,
    },
    {
      keys: [
        "_sao_respeitados_o_periodo_de_carencia_dos_produtos_conforme_recomendacao_tecnica352081",
        "carencia_respeitada",
      ],
      label: "12.7 São respeitados os períodos de carência conforme recomendação técnica?",
      questionId: "12.7",
      imprescindivel: false,
    },
  ],
  manutencaoPreventiva: [
    {
      keys: [
        "_existe_um_cronograma_de_manutencao_programada_dos_equipamentos355060",
        "cronograma_manutencao",
      ],
      label: "13.1 Existe um cronograma de manutenção programada dos equipamentos?",
      questionId: "13.1",
      imprescindivel: false,
    },
    {
      keys: [
        "_ha_registro_das_manutencoes_executadas_nos_equipamentos352050",
        "registro_manutencoes",
      ],
      label: "13.2 Há registro das manutenções executadas nos equipamentos?",
      questionId: "13.2",
      imprescindivel: false,
    },
  ],
  bemEstarAnimal: [
    {
      keys: [
        "_entrevistador_as_instalacoes_da_propriedade_garantem_bem_estar_animal352087",
        "instalacoes_bem_estar",
      ],
      label: "14.2 As instalações da propriedade garantem o bem-estar animal?",
      questionId: "14.2",
      imprescindivel: false,
    },
    {
      keys: [
        "_ha_registro_de_treinamentos_realizados_sobre_o_manejo_racional_visando_bem_estar_animal352091",
        "registro_treinamento_bem_estar",
      ],
      label: "14.3 Há registro de treinamentos realizados sobre o manejo racional visando o bem-estar animal?",
      questionId: "14.3",
      imprescindivel: false,
    },
  ],
};

export const PBPA_ACTIONS_BY_CATEGORY = {
  gestaoPropriedade: [
    "Implantar registros zootécnicos e financeiros (receitas, despesas, coberturas, nascimentos, controle leiteiro).",
    "Estabelecer assistência técnica regular e acompanhar a evolução dos indicadores da propriedade.",
  ],
  gestaoInsumos: [
    "Implantar controle de estoque e calendário de aquisição de insumos.",
    "Organizar a compra de insumos para evitar falta de produtos críticos (detergentes, CMT, peças).",
  ],
  manejoSanitario: [
    "Regularizar calendário sanitário e exames obrigatórios (brucelose, tuberculose).",
    "Ajustar protocolo de mastite, colostro e manejo de animais doentes com visita técnica.",
  ],
  manejoAlimentarArmazenamento: [
    "Ajustar planejamento alimentar, dieta por fase de lactação e disponibilidade de volumoso.",
    "Adequar armazenamento de alimentos e produtos químicos e realizar análise/correção de solo.",
  ],
  qualidadeAgua: [
    "Higienizar reservatórios e garantir potabilidade da água usada na limpeza de equipamentos.",
    "Realizar análise da qualidade da água e implantar tratamento (ex.: cloração).",
  ],
  higienePessoalSaude: [
    "Disponibilizar EPIs e garantir local adequado para higiene pessoal (água e sabão).",
    "Orientar a equipe sobre higiene pessoal e uso correto dos equipamentos de proteção.",
  ],
  controleIntegradoPragas: [
    "Implantar estratégia de controle integrado de pragas na propriedade.",
    "Monitorar focos de pragas e registrar as ações de controle realizadas.",
  ],
  capacitacaoTrabalhadores: [
    "Promover treinamentos periódicos com evidências de participação.",
    "Registrar os treinamentos realizados (fotos, listas de presença, certificados).",
  ],
  manejoOrdenhaPosOrdenha: [
    "Padronizar a rotina de ordenha, linha de ordenha e higiene de equipamentos/utensílios.",
    "Implantar testes de caneca de fundo preto e CMT e separar a ordenha de vacas em tratamento.",
  ],
  refrigeracaoEstocagemLeite: [
    "Verificar capacidade do tanque e rotina de controle de temperatura do leite.",
    "Manter a área de armazenamento do leite limpa e adequada à refrigeração.",
  ],
  manejoResiduosDejetos: [
    "Implantar manejo adequado de esterco e tratamento de efluentes da ordenha.",
    "Definir procedimentos para descarte do leite inadequado e de resíduos sólidos.",
  ],
  usoRacionalQuimicos: [
    "Regularizar uso, estocagem e rastreabilidade de agroquímicos e medicamentos veterinários.",
    "Reforçar período de carência e registro de aplicações e treinamentos.",
  ],
  manutencaoPreventiva: [
    "Executar manutenção preventiva e calibragem dos equipamentos.",
    "Criar cronograma periódico de manutenção com responsável definido e registro das execuções.",
  ],
  bemEstarAnimal: [
    "Adequar instalações e técnicas de manejo para garantir o bem-estar animal.",
    "Registrar treinamentos de manejo racional visando o bem-estar animal.",
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
};
