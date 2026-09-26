# Painel administrativo conectado à loja

## Objetivo
Transformar o painel em uma central operacional real: tudo que for salvo nele deve aparecer na loja, e os indicadores devem vir dos pedidos, clientes e estoque existentes. A integração da Shein ficará pronta para receber credenciais depois, sem armazená-las na tela ou no código.

## Escopo da implementação

### 1. Corrigir e consolidar o banco atual
- Criar uma migração incremental e segura, sem apagar dados existentes.
- Alinhar os campos que hoje divergem entre telas e banco: produtos ativos/publicados, categorias ativas e ordenadas, tamanhos/cores das variações, banners, configurações da loja, carrinho, pedidos e estoque.
- Criar as tabelas ausentes para fornecedores, configurações da Shein e registros de sincronização.
- Criar o espaço de imagens e vídeos com permissões adequadas.
- Aplicar permissões por função: público lê apenas conteúdo publicado; clientes acessam somente seus próprios dados; administradores gerenciam a operação.
- Migrar a função de administrador para uma tabela separada de permissões, evitando que uma cliente consiga alterar o próprio acesso.

### 2. Tornar a autenticação e os dados de clientes consistentes
- Manter no perfil da cliente somente nome, CPF/documento e telefone.
- Manter endereços em cadastro separado, vinculados à conta da cliente.
- Fazer o painel reconhecer a administradora com validação segura e listar clientes reais sem expor senhas ou credenciais.
- Fazer login, carrinho, checkout, pedidos, favoritos e conta compartilharem corretamente o estado da sessão.

### 3. Conectar o catálogo e o carrinho
- Produtos, categorias, variantes, preços, promoções, estoque, fotos e vídeos serão gravados pelo painel.
- A loja pública exibirá somente produtos ativos e publicados, sem produtos de demonstração quando o catálogo real estiver disponível.
- O carrinho usará variantes reais e persistirá por cliente; o pedido será criado a partir do carrinho real.
- Estoque e reservas serão atualizados pelo fluxo de pedido, com alertas baseados em quantidades reais.

### 4. Fazer o editor da Home comandar o site
- Conectar banners, textos, botões, ordem e visibilidade das seções, produtos destacados, categorias, contatos, redes sociais e rodapé.
- Garantir que alterações salvas sejam refletidas na Home e na navegação após atualização.
- Padronizar upload, edição, ordenação, ativação e exclusão de imagens e banners.

### 5. Completar as áreas administrativas
- **Visão geral:** vendas pagas, pedidos, ticket médio, clientes, produtos, estoque baixo e desempenho por período.
- **Pedidos:** consulta, detalhes, pagamento, status, envio e rastreio.
- **Clientes:** nome, documento, telefone, e-mail, endereços e histórico de pedidos.
- **Fornecedores:** cadastro completo, vínculo com produtos e estado da integração.
- **Relatórios:** vendas, produtos mais vendidos, estoque, clientes e pagamentos, sempre com estados vazios claros quando não houver dados.
- Substituir as telas atualmente genéricas de Clientes, Financeiro, Devoluções, Análises e Configurações por telas funcionais dentro do escopo dos dados existentes.

### 6. Deixar a Shein pronta para conexão
- Criar no painel uma área “Shein” com estado da conexão, teste de conexão, última sincronização, erros e ações de importar/sincronizar.
- Preparar chamadas somente pelo servidor; nenhuma credencial será exposta no navegador ou gravada no banco.
- Modelar o vínculo entre produto local, variante local e identificadores da Shein, além do histórico de sincronização.
- Exibir “Aguardando credenciais” enquanto elas não forem adicionadas.
- Quando o painel estiver aprovado, solicitar as credenciais pelo formulário seguro e concluir os testes com a conta oficial da Shein.

## Validação
- Verificar salvamento e edição de produto, categoria, banner, conteúdo da Home, fornecedor e dados da loja.
- Conferir que a Home e o catálogo refletem as mudanças administrativas.
- Testar visitante e cliente conectado no carrinho, checkout, conferência e pagamento.
- Testar permissões de cliente e administrador separadamente.
- Conferir todas as páginas em computador e celular, erros no navegador e estado final da compilação.

## Dependência externa
O projeto usa um banco externo já conectado. A migração será entregue no projeto, mas precisará ser aplicada nesse banco antes dos testes finais de gravação. As credenciais da Shein serão solicitadas somente depois que o restante do painel estiver operacional.
