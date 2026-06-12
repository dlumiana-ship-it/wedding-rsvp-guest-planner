# Wedding App — Guia de Deploy (Supabase + Vercel + Domínio)

## Pré-requisitos
- Conta no [GitHub](https://github.com)
- Conta no [Supabase](https://supabase.com) (grátis)
- Conta no [Vercel](https://vercel.com) (grátis)
- Domínio personalizado (opcional)

---

## PASSO 1 — Criar o Projecto no Supabase

1. Acede a [supabase.com](https://supabase.com) e clica em **New Project**
2. Dá um nome ao projecto (ex: `wedding-lumiana-vicente`)
3. Define uma **password forte** para a base de dados — guarda-a
4. Escolhe a região mais próxima de Moçambique: **ap-southeast-1 (Singapore)**
5. Clica **Create new project** e aguarda ~2 minutos

### Obter as credenciais da base de dados:
1. No painel do Supabase → **Settings** → **Database**
2. Desce até **Connection Pooling** → copia o URL e substitui `[YOUR-PASSWORD]` com a tua password → este é o **DATABASE_URL**
3. Volta acima → **Connection String** → selecciona **URI** → este é o **DIRECT_URL**

---

## PASSO 2 — Configurar o ficheiro `.env` local

Cria o ficheiro `.env` na raiz do projecto (copia do `.env.example`):

```bash
# No terminal, dentro da pasta do projecto:
copy .env.example .env
```

Edita o `.env` e substitui com as tuas credenciais reais do Supabase.

---

## PASSO 3 — Executar a migração e seed na Supabase

```bash
# Instalar dependências (se ainda não instalaste)
npm install

# Gerar o Prisma Client para PostgreSQL
npx prisma generate

# Criar as tabelas no Supabase
npx prisma migrate dev --name init

# Popular a base de dados com os convidados de teste
npm run db:seed
```

Verifica em **Supabase → Table Editor** que a tabela `Guest` foi criada e preenchida.

---

## PASSO 4 — Criar o Repositório no GitHub

```bash
# Inicializar Git (se ainda não inicializado)
git init

# Adicionar todos os ficheiros
git add .

# Primeiro commit
git commit -m "feat: wedding app - Lumiana & Vicente"

# Criar repositório no GitHub (substitui SEU_UTILIZADOR e NOME_REPO):
# Vai a github.com → New Repository → nomear → Create
# Depois:
git remote add origin https://github.com/SEU_UTILIZADOR/NOME_REPO.git
git branch -M main
git push -u origin main
```

---

## PASSO 5 — Criar e Configurar o Projecto no Vercel

### Opção A — Via Interface Web (mais simples):
1. Vai a [vercel.com](https://vercel.com) → **Add New Project**
2. Clica **Import Git Repository** → autoriza o GitHub → selecciona o repositório
3. Em **Environment Variables**, adiciona:
   - `DATABASE_URL` — URL de Connection Pooling do Supabase
   - `DIRECT_URL` — URI directa do Supabase
   - `GEMINI_API_KEY` — a tua chave da API Gemini
4. Clica **Deploy** — o Vercel faz o build e deploy automaticamente

### Obter as credenciais do Vercel para o GitHub Actions:
1. Vercel → Account Settings → **Tokens** → Create Token → copia → este é `VERCEL_TOKEN`
2. No terminal: `vercel link` → segue as instruções → vai ver `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` em `.vercel/project.json`

---

## PASSO 6 — Configurar Secrets no GitHub

No GitHub → repositório → **Settings** → **Secrets and variables** → **Actions** → New secret:

| Secret | Valor |
|---|---|
| `DATABASE_URL` | URL de pooling do Supabase |
| `DIRECT_URL` | URI directa do Supabase |
| `GEMINI_API_KEY` | Chave da API Gemini |
| `VERCEL_TOKEN` | Token do Vercel |
| `VERCEL_ORG_ID` | ID da organização Vercel |
| `VERCEL_PROJECT_ID` | ID do projecto Vercel |

A partir daqui, **qualquer push para `main`** despoleta um deploy automático! 🚀

---

## PASSO 7 — Domínio Personalizado (Opcional)

### Se tens um domínio (ex: `casamento-lumiana-vicente.com`):

**No Vercel:**
1. Projecto → **Settings** → **Domains** → Add Domain
2. Introduz o teu domínio → Vercel mostra os registos DNS

**No teu registador de domínio (GoDaddy, Namecheap, etc.):**
1. Vai à gestão de DNS
2. Adiciona um registo **CNAME**:
   - Nome: `www` (ou `@` para o domínio raiz)
   - Valor: `cname.vercel-dns.com`
3. Se queres o domínio raiz (`@`), adiciona um registo **A**:
   - Valor: `76.76.19.61`
4. Aguarda propagação DNS (~5-30 minutos)

O Vercel activa HTTPS automaticamente via Let's Encrypt.

### Se NÃO tens domínio:
O teu site fica em `https://NOME-REPO.vercel.app` — gratuito e com HTTPS.

---

## Fluxo de Trabalho após Configuração

```
Tu editas código → git push origin main
       ↓
GitHub Actions executa:
  1. npm install
  2. prisma generate
  3. prisma migrate deploy (actualiza schema no Supabase se mudou)
  4. vercel build --prod
  5. vercel deploy --prebuilt --prod
       ↓
Site actualizado em ~2 minutos no domínio! ✅
```

---

## Resumo de Credenciais de Teste

| Perfil | Telemóvel | PIN |
|---|---|---|
| **Staff** | +258840000000 | `0000` |
| Convidado Ana | +258840001111 | `1111` |
| Convidado Carlos | +258840002222 | `2222` |
| Convidado Fátima | +258840003333 | `3333` |
| ... | ... | últimos 4 dígitos |

---

## Resolução de Problemas

**Erro `P1001: Can't reach database server`:**
- Verifica se o `DATABASE_URL` tem `?pgbouncer=true` no final
- Confirma que a password está correcta (sem caracteres especiais não escapados)

**Erro `Error: Cannot find module '@prisma/client'`:**
```bash
npx prisma generate
```

**Migração falha no GitHub Actions:**
- Confirma que o `DIRECT_URL` usa a porta `5432` (não `6543`)
- Verifica os secrets no GitHub

**Site não actualiza após push:**
- Verifica o separador **Actions** no GitHub para ver o estado do workflow
- Confirma que os 6 secrets estão correctamente definidos
