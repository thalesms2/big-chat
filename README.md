# Big Chat Brasil

Aplicação para comunicação B2C com controle de créditos.

### Instruções
Suba a aplicação inteira com um comando, docker compose sobe o front, back e o banco.

```bash
# Para subir a aplicação:
docker-compose up 
# Para subir a aplicação sem ocupar o terminal:
docker-compose up -d
# Para parar a aplicação caso tenha iniciado com o comando acima:
docker-compose down 
# Para parar a aplicação e apagar os dados:
docker-compose down -v
```

Para criar os clientes:
```bash
curl --request POST \
  --url http://localhost:3000/clients \
  --header 'Content-Type: application/json' \
  --data '{
	"name": "Teste",
	"document": "64006465076",
	"documentType": "CPF",
	"planType": "prepaid"
}'
```

Para rodar os testes do backend:
```bash
cd server && npm test
```

## Backend
> Aplicação roda localmente na porta 3000
> Rota `/api` está a documentação feita com o swagger

### Tecnologias
* Nest.js
* Prisma ORM
* Jest
* Socket.io
* PostgreSQL

Para gerar o Client do Prisma e o LSP não informar erro nas importações:
```bash
npx prisma generate
```

## Frontend
> Aplicação roda localmente na porta 5174

### Tecnologias
* Vue
* Vuetify
* Pinia
* Vue-Router
* Axios
* Socket.io
* TailwindCSS

## Implementações
- [X] Autenticação via token (gera a identificação do cliente pelo Token JWT)
- [X] Gerenciamento de clientes
- [X] Validação de saldo/limite conforme tipo de plano
- [X] Documentação da API via Swagger/OpenAPI
- [X] Fila de processamento de mensagens assíncrona usando `worker-threads`
- [X] Implementação de duas filas com prioridade e outra FIFO
- [X] Envio e recebimento de mensagens
- [X] Alteração de estado das mensagens
- [X] Webhook de mensagem recebida
- [X] Webhook de alteração de estado
- [X] Testes unitários
- [ ] Implementação da fila usando `bullMQ` e Redis
- [ ] Tratamento de erros e feedback detalhado
- [ ] Implementação de logs e analytics do worker
- [ ] Implementação de Cache
- [ ] CI/CD
- [X] Login com documento do cliente
- [X] Lista de conversas recentes
- [X] Tela de Chat com histórico de mensagens
- [X] Envio de novas mensagens
- [ ] Pesquisa simples na conversa
- [X] Visualização do saldo restante
- [X] Feedback de estado da mensagem em tempo real
- [X] Notificações para novas mensagens e alteração de estado
- [X] Webhook de ativação quando a conversa entra em foco, para alteração de estado da mensagem para lida
- [ ] Histórico de transações
- [ ] Criação de planos e lógica para quando o plano for pago adicionar o valor no balanço da conta

