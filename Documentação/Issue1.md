# Estrutura Moduladar

- `main.py`
  - Interface principal Tkinter/ttkbootstrap.
  - Frames de navegação e fluxo da aplicação.
  - Classe `DashboardApp` e ponto de entrada `main()`.

- `config.py`
  - Carregamento de `.env`.
  - Caminhos de cache/log.
  - Configuração de endpoint (`API_DOC`).

- `domain_constants.py`
  - Mapeamentos de campos da pesquisa.
  - Constantes de métricas, IBP e eixos de radar. Evitar de enviar isso para o git.

- `domain_utils.py`
  - Normalizações e conversões (`safe_float`, `parse_bool`, `normalize`).
  - Cálculos de análise (`pearson_correlation`, `calculate_ibp`).
  - Funções reutilizáveis de radar (`performance_radar_values`, `average_performance_radar_values`).

- `models.py`
  - Modelo de dados principal: `ProducerSnapshot`.

- `services.py`
  - `ColetumClient`: integração com API + cache.
  - `ActivityLogger`: persistência de auditoria.
  - `ActionEngine`: sugestões de ação.
  - `DataRepository`: transformação de payload e acesso a dados para UI.

- `charts.py`
  - `ChartFactory` com todos os gráficos reutilizáveis.

- `queries.py`
  - Query GraphQL centralizada. Evitar de enviar isso para o git.

## Próximos Passos

1. Adicionar testes unitários para `domain_utils.py` e `services.py`.
2. Documentar fluxo de dados da API até os gráficos em um diagrama simples.
