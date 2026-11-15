# Contexto do projeto: NEXUS

O NEXUS é um Enterprise Knowledge System: uma aplicação empresarial que organiza conhecimento e conecta a gestão de dados, pessoas, agentes de inteligência artificial e rotinas de trabalho. Seu objetivo inicial é atender à demanda específica de um cliente por meio de uma proposta visual de produto. O projeto também surgiu no contexto de uma oportunidade profissional relacionada a IA e Google Cloud; o histórico está em `CONTEXTO_VAGA.txt`. Os requisitos particulares do cliente ainda devem ser detalhados; não presumir contratação, dados reais ou integrações existentes.

O briefing detalhado de produto, telas, fluxos e referências visuais está em `Plano Nexus.txt`. Este arquivo registra o contexto essencial para orientar o trabalho no projeto.

## Fase atual

- A prioridade é construir a interface conceitual do NEXUS e representar visualmente o funcionamento pretendido da aplicação.
- A interface pode usar dados fictícios coerentes entre telas e interações locais de demonstração. O grau de interatividade ainda depende de definição do usuário.
- Backend, integração com serviços, processamento de dados real, execução de agentes, autenticação e infraestrutura de nuvem pertencem a fases posteriores e não devem ser presumidos como implementados.
- Não apresentar dados, ações ou integrações simuladas como reais. Não instalar dependências nem iniciar implementação somente em resposta a pedidos de análise ou planejamento.

## Conceito e experiência do produto

- O sistema reúne quatro áreas de gestão: dados e conhecimento; pessoas; agentes e skills; rotinas e tarefas.
- Um canvas visual no-code permite representar conexões entre pessoas, agentes, fontes de dados, ferramentas e tarefas. O gestor deve compreender o significado de cada conexão e o acesso configurado.
- Um Kanban permite acompanhar tarefas, responsáveis humanos e agentes envolvidos. O detalhe da tarefa reúne histórico, conversas vinculadas, evidências, resultados do agente e entrega do funcionário.
- O gestor poderá consultar o histórico autorizado e conversar sobre uma execução, investigar descobertas e comparar os resultados com a entrega humana. Acesso a conversas e informações deve respeitar permissões e o contexto da tarefa.
- O conhecimento corporativo é navegável por listas, pesquisa e uma tela específica de grafo. O canvas de configuração e o grafo de conhecimento cumprem funções distintas.
- Fontes corporativas, dados processados, autoria humana, inferências da IA e evidências devem ser distinguíveis e rastreáveis no conceito.

## Arquitetura conceitual futura

- Google Cloud é a base tecnológica pretendida; Vertex AI fornece capacidades de IA e agentes, e Spanner com Spanner Graph é a direção para a memória de conhecimento.
- O Spanner pode reunir dados relacionais, relações de grafo e embeddings na mesma base. RAG e GraphRAG são estratégias de recuperação de contexto, não bancos adicionais obrigatórios. Arquivos originais podem exigir armazenamento de objetos separado.
- As fontes da empresa devem passar por pré-processamento e regras de negócio adequados antes de alimentar a base de conhecimento. Permissões, proveniência e atualização das fontes são requisitos conceituais.
- Essas escolhas descrevem a visão futura e não significam que serviços tenham sido criados ou conectados.

## Stack de interface recomendada

A stack abaixo foi recomendada durante a análise; sua adoção e instalação ainda não foram confirmadas pelo usuário:

- React e TypeScript para a interface; Vite para desenvolvimento e build.
- React Flow (`@xyflow/react`) para nós e conexões personalizáveis no canvas.
- Tailwind CSS e CSS personalizado para o visual; shadcn/ui como base opcional de componentes.
- React Router para navegação; dnd kit como opção para arrastar cartões no Kanban.

## Direção visual e decisões pendentes

A referência do canvas é o LangFlow, com composição minimalista, nós personalizados, conexões finas e iluminação neon discreta. As imagens enviadas também orientam o uso de camadas, transparência, efeito de vidro e painéis contextuais. Decisão de tema: construir primeiro somente o tema escuro (carvão, azul-marinho e petróleo, conforme `Plano Nexus.txt`). O tema claro será criado apenas depois que o escuro for aprovado; até lá, não implementar nem manter variantes claras em paralelo. Os tokens de cor devem ficar centralizados para facilitar a criação posterior do tema claro.

Também permanecem abertas a profundidade das interações do protótipo e a escolha entre cenário fictício genérico ou cenário do setor de energia. Não tratar recomendações ou questões em aberto como decisões definitivas.
