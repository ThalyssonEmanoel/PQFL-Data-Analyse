# Data 31/03/26 — Backlog da Ferramenta de Dashboard

## Objetivo Geral
- Implementar uma ferramenta desktop em Python/Tkinter (tema `themename="superhero"`) que consome um webservice de formulários via requisição GET, organiza os dados de produtores e fornece dashboards interativos, análises por grupos (P1–P4) e comparação temporal mês a mês.

## Entregas Prioritárias da Sprint
1. **Integração com o webservice**
	- Documentar URL, parâmetros, autenticação e limites do endpoint que retorna os formulários.
	- Implementar cliente GET com tratamento de erros, cache/local storage dos últimos dados e testes de conectividade.
	- Padronizar o modelo de dados interno (produtor, respostas do formulário, período de referência) para alimentar os gráficos e as telas.

2. **Interface base com Tkinter**
	- Configurar projeto para Tkinter + ttkbootstrap (ou lib equivalente) garantindo uso do tema `superhero`.
	- Criar janela principal responsiva, com navegação clara entre as três opções iniciais: “Produtores”, “Grupos” e “Comparar Informações”.
	- Definir componentes compartilhados (menus, botões padrão, modais) para reutilização nas demais telas.

3. **Tela Inicial**
	- Exibir cards/botões para cada opção (Produtores, Grupos, Comparar Informações) com descrições curtas do que o usuário encontrará.
	- Logar o acesso e a seleção do usuário no registro de atividades de produtores.

4. **Fluxo Produtores**
	- Listar todos os produtores em ordem alfabética; permitir filtro e busca por nome/ID.
	- Ao selecionar um produtor, abrir detalhe individual com gráficos (linha, barra, radar) das métricas relevantes trazidas pela API.
	- Incluir botão “Ações recomendadas” que abre modal descrevendo medidas para aquele produtor específico, com base nas problemáticas detectadas.
	- Garantir que os dados mostrados estejam sincronizados com o período selecionado na ferramenta de comparação (quando aplicável).

5. **Fluxo Grupos (P1 a P4)**
	- Exibir quatro cards (P1 a P4) com as cores: verde escuro (P1, melhor), verde claro (P2), laranja (P3) e vermelho (P4, pior).
	- Cada card deve ter botão “Ação” que abre modal listando ações possíveis para melhorar o desempenho dos produtores daquele grupo.
	- Ao clicar no card, abrir nova tela com: gráficos principais do grupo, select para filtrar produtores do grupo e lista ordenada.
	  - P1 e P2: ordenar da melhor para a pior classificação.
	  - P3 e P4: ordenar da pior para a melhor classificação.
	- Ao clicar em um produtor dentro da lista do grupo, abrir modal com ações específicas para aquele produtor (podem ser mesmas ações do fluxo Produtores, porém contextualizadas ao grupo).

6. **Fluxo Comparar Informações**
	- Permitir seleção de dois períodos (mês/ano) — ex.: 01/2025 x 02/2025.
	- Listar produtores mostrando o grupo em que estavam no período “antes” e o grupo no período “depois”.
	- Ao selecionar um produtor, exibir dashboards comparativos (gráficos lado a lado ou sobrepostos) destacando mudanças por indicador.
	- Inferir e mostrar, em texto, quais ações provavelmente foram tomadas para justificar a mudança entre períodos com base nas diferenças observadas.

7. **Log e Auditoria**
	- Manter log estruturado com nome do produtor, grupo, período, ações recomendadas e status (pendente/concluída, se aplicável).
	- Permitir exportar o log (CSV/JSON) para consulta externa e utilizar o histórico para alimentar o fluxo de comparação.

8. **Definições e Dependências Pendentes**
	- Confirmar credenciais/autenticação do webservice e se existe limite de chamadas por minuto.
	- Validar critérios que classificam produtores em P1–P4 (regras de negócio/thresholds) e se essa análise ocorrerá localmente ou virá pronta do webservice.
	- Especificar quais métricas devem compor os gráficos principais (produtor e grupo) e quais ações recomendadas estarão disponíveis por grupo.
	- Definir estrutura mínima do modal (layout e campos obrigatórios) para padronizar as ações sugeridas.

## Regras de Aceite
- Todos os fluxos precisam funcionar offline com dados previamente carregados (fallback) ou exibir aviso claro quando a API estiver indisponível.
- Ordenações e filtros devem ser consistentes em todas as telas.
- Modais precisam ser fecháveis tanto por botão dedicado quanto por tecla ESC.
- Dashboards devem ser interativos (tooltip, highlight) e atualizados instantaneamente após trocar o período ou o produtor selecionado.

## Sugestões de Próximos Passos
- Validar com o time de negócio os critérios de classificação P1–P4 e o modelo de ações por grupo/produtor.
- Levantar os detalhes do endpoint (URL, autenticação, limites) antes de iniciar o desenvolvimento do cliente GET.
- Esboçar protótipos das telas em Tkinter/ttkbootstrap para alinhar UI e experiência antes da implementação final.

