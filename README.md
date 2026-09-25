# Cabanha Cala Bassa — Loja online (criei esse read me com IA)

E-commerce da Cabanha Cala Bassa, criatório de cavalos crioulos: venda de **coberturas**, **cavalos** e **vestuário** (camisetas e bonés), com checkout pelo Mercado Pago (Pix e cartão) e painel administrativo.

| Pasta | Stack |
|---|---|
| [`web/`](web) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| [`backend/`](backend) | Fastify 5, TypeScript, Prisma 5, PostgreSQL, Zod |

Serviços externos: Mercado Pago (Checkout Pro + webhook), Cloudflare R2 (imagens e vídeos), Resend (e-mail), Sentry (erros).

## Funcionalidades

**Loja**
- Catálogo por categoria, busca sem acentos com filtro de preço e página de produto com galeria
- Sacola com escolha de cor e tamanho, entrega com frete fixo (CEP via ViaCEP) ou retirada no local
- Cupons de desconto: percentual ou valor fixo, com limite de usos, valor mínimo e validade
- Pagamento no Mercado Pago; o pedido é confirmado por webhook
- Área do cliente: pedidos com linha do tempo e rastreio, dados cadastrais e troca de senha

**Painel administrativo**
- Produtos: cadastro, edição, ativação e galeria com recorte de imagem
- Pedidos: status, transportadora e código de rastreio
- Cupons, notícias da home e relatório de vendas por período

## Arquitetura

```
web (Next.js) ──HTTPS──▶ backend (Fastify) ──▶ PostgreSQL (Prisma)
                               │
                               ├──▶ Mercado Pago (preferência de pagamento + webhook)
                               ├──▶ Cloudflare R2 (upload de mídia)
                               └──▶ Resend (e-mail de redefinição de senha)
```

### Backend (`backend/src`)

```
server.ts              configuração do Fastify (CORS, helmet, rate limit) e registro das rotas
http.ts                validação com Zod, guards de autenticação e tratamento central de erros
serializers.ts         conversão de entidades do Prisma para JSON
routes/                auth · products · uploads · orders · discounts · news · admin-reports · public
services/              mercadopago · discounts · storage (R2) · email
jwt.ts, refresh-tokens.ts, password-reset-token.ts, field-crypto.ts
```

- Cada arquivo de `routes/` é um plugin do Fastify. As rotas validam a entrada com `parseBody(schema, body)` e lançam `BadRequestError` para erros de regra de negócio. O `errorHandler` converte tudo para o formato `{ error }`.
- **Preço nunca vem do cliente.** `POST /orders` busca o preço atual de cada item, reserva o estoque e aplica o cupom dentro de uma transação.
- A mesma função `evaluateDiscount` calcula a prévia do cupom no carrinho e o desconto aplicado no pedido.

### Frontend (`web/src`)

```
app/                   rotas (loja em (main)/, painel em admin/, com guard em admin/layout.tsx)
components/            componentes compartilhados (seções de produto, navegação, spinner, recorte)
context/               sessão, sacola e pagamento pendente
hooks/use-api.ts       busca de dados com estado de loading e erro
lib/                   cliente HTTP, formatação, catálogo, status de pedido, ViaCEP
```

## Segurança

- **Sessão:** access token JWT curto, mantido só em memória. O refresh token é opaco, fica num cookie `httpOnly` e é **rotacionado** a cada uso, com o hash guardado no banco. Logout e troca de senha invalidam todas as sessões (`sessionVersion`).
- **Dados pessoais:** CPF/CNPJ e telefone são criptografados em repouso com AES-256-GCM. Um hash HMAC garante a unicidade do CPF sem expor o valor.
- **Webhook do Mercado Pago:** a assinatura HMAC é validada e o pagamento é sempre reconsultado na API do MP antes de marcar o pedido como pago.
- **Uploads:** o tipo real do arquivo é validado pelos *magic bytes* e as dimensões da imagem são limitadas.
- **Outros:** rate limit nas rotas de autenticação, CORS por allowlist, helmet, e HTML removido do conteúdo das notícias.

## Rodando localmente

Pré-requisitos: Node 20+ e PostgreSQL.

```bash
# API
cd backend
cp .env.example .env            # preencha DATABASE_URL, JWT_SECRET e FIELD_*
npm install
npx prisma migrate deploy
npm run seed                    # cria produtos e usuários de teste (senha em SEED_PASSWORD ou gerada e exibida no terminal)
npm run dev                     # http://localhost:3333

# Site
cd web
cp .env.local.example .env.local
npm install
npm run dev                     # http://localhost:3001
```

O pagamento, o upload de imagens e o envio de e-mail só funcionam com as credenciais do Mercado Pago, do R2 e do Resend preenchidas no `.env` (veja `backend/.env.example`). Sem elas, o resto da aplicação funciona normalmente.

## Deploy

- **API:** Railway, com *Root Directory* `backend` (`railway.toml`). O `npm start` aplica as migrations, criptografa dados legados e sobe o servidor.
- **Site:** Vercel, com *Root Directory* `web`.
- **Mercado Pago:** configure o webhook para `https://<api>/webhooks/mercadopago` e defina `BASE_URL`, `WEB_APP_URL` e `MERCADOPAGO_WEBHOOK_SECRET` na API.
- **CI:** `.github/workflows/security-audit.yml` roda `npm audit` na API e no site.
