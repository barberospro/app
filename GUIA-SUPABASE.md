# Guia de Gestao Manual - BarberOS (Supabase)

## Acesso ao Painel Supabase

- **URL do Projeto:** https://supabase.com/dashboard/project/seyadufuohsbpcqaguig
- **Project Ref:** seyadufuohsbpcqaguig
- **Login:** Use sua conta Supabase (covalsqui.arrabal1@gmail.com)

---

## Tabelas Principais

### shops - Barbearias cadastradas
| Coluna | Descricao |
|--------|-----------|
| id | UUID da barbearia |
| owner_id | UUID do dono (auth.users) |
| name | Nome da barbearia |
| slug | Identificador na URL (?s=slug) |
| address | Endereco |
| whatsapp | WhatsApp do admin (com DDI) |
| instagram | @ do Instagram |
| pix_key | Chave PIX |
| opening_time | Horario abertura (ex: 09:00) |
| closing_time | Horario fechamento (ex: 20:00) |
| lunch_start | Inicio almoco |
| lunch_end | Fim almoco |
| slot_duration | Duracao do slot em minutos |
| active | true/false |

Onde encontrar: Table Editor > shops

---

### barbers - Barbeiros de cada barbearia
| Coluna | Descricao |
|--------|-----------|
| id | UUID do barbeiro |
| shop_id | UUID da barbearia (FK > shops.id) |
| name | Nome do barbeiro |
| specialty | Especialidade |
| commission_pct | Percentual de comissao (0-100) |
| avatar_emoji | Emoji do avatar |
| rating | Nota (1-5) |
| active | true/false |

Onde encontrar: Table Editor > barbers

---

### barber_users - Acessos de login para barbeiros
| Coluna | Descricao |
|--------|-----------|
| id | UUID do registro |
| shop_id | UUID da barbearia |
| barber_id | UUID do barbeiro (FK > barbers.id) |
| user_id | UUID do usuario (FK > auth.users.id) |

Onde encontrar: Table Editor > barber_users

Essa tabela vincula um login (auth.users) a um barbeiro.
Limite: 3 acessos por barbearia.

---

### services - Servicos oferecidos
| Coluna | Descricao |
|--------|-----------|
| id | UUID do servico |
| shop_id | UUID da barbearia |
| name | Nome (ex: Corte, Barba) |
| price | Preco em reais |
| duration_minutes | Duracao em minutos |
| category | Categoria |
| active | true/false |

Onde encontrar: Table Editor > services

---

### appointments - Agendamentos
| Coluna | Descricao |
|--------|-----------|
| id | UUID do agendamento |
| shop_id | UUID da barbearia |
| client_name | Nome do cliente |
| client_phone | WhatsApp do cliente |
| barber_id | UUID do barbeiro |
| barber_name | Nome do barbeiro |
| service_id | UUID do servico |
| service_name | Nome do servico |
| service_price | Valor cobrado |
| services_json | JSON com servicos (combo) |
| total_duration_minutes | Duracao total |
| appointment_date | Data (YYYY-MM-DD) |
| appointment_time | Horario (HH:MM:SS) |
| status | pending / confirmed / done / finished / cancelled |
| payment_method | pix / credito / debito / local |
| payment_status | pending / paid |

Onde encontrar: Table Editor > appointments

---

### packages - Pacotes
| Coluna | Descricao |
|--------|-----------|
| id | UUID |
| shop_id | UUID da barbearia |
| name | Nome do pacote |
| description | Descricao |
| items | JSON array de strings |
| price | Preco do pacote |
| original_price | Preco original (riscado) |
| badge | Texto do badge |
| active | true/false |

---

### promotions - Promocoes
| Coluna | Descricao |
|--------|-----------|
| id | UUID |
| shop_id | UUID da barbearia |
| name | Nome |
| description | Descricao |
| emoji | Emoji |
| original_price | Preco original |
| promo_price | Preco promocional |
| active | true/false |

---

## Gerenciar Usuarios (auth.users)

Onde: Authentication > Users

### Criar um novo usuario (dono de barbearia)
1. Authentication > Users > Add user
2. Preencha e-mail e senha
3. Apos criar, copie o id do usuario
4. Va em Table Editor > shops > Insert Row
5. Preencha owner_id com o UUID copiado + dados da barbearia

### Criar acesso de barbeiro manualmente
1. Authentication > Users > Add user (e-mail e senha do barbeiro)
2. Copie o id do novo usuario
3. Va em Table Editor > barbers - anote o id do barbeiro desejado
4. Va em Table Editor > barber_users > Insert Row:
   - shop_id: UUID da barbearia
   - barber_id: UUID do barbeiro
   - user_id: UUID do novo usuario criado

### Remover acesso de barbeiro
1. Table Editor > barber_users
2. Encontre a linha pelo user_id ou barber_id
3. Delete a linha
4. (Opcional) Authentication > Users > delete o usuario

### Bloquear/Desbloquear usuario
1. Authentication > Users
2. Encontre o usuario
3. Use Ban user para bloquear ou Unban para desbloquear

---

## Edge Functions (funcoes serverless)

| Funcao | Descricao |
|--------|-----------|
| admin-clientes | Lista, edita, exclui clientes (painel super admin) |
| create-barber-user | Cria usuario auth + vincula na barber_users |
| hotmart-webhook | Recebe compras da Hotmart e cria acesso |

Onde editar: Supabase Dashboard > Edge Functions

---

## Chaves (referencia)

| Chave | Valor |
|-------|-------|
| Project URL | https://seyadufuohsbpcqaguig.supabase.co |
| Anon Key | Visivel no codigo (index.html linha 776) |
| Service Role Key | No painel Supabase > Settings > API (NAO expor publicamente!) |

IMPORTANTE: A Service Role Key tem acesso total ao banco. Use apenas no painel ou em funcoes serverless.

---

## Operacoes Comuns

### Mudar comissao de um barbeiro
Table Editor > barbers > encontre o barbeiro > edite commission_pct

### Desativar um barbeiro
Table Editor > barbers > encontre o barbeiro > mude active para false

### Cancelar agendamento
Table Editor > appointments > encontre pelo ID > mude status para cancelled

### Mudar horario de funcionamento
Table Editor > shops > encontre a barbearia > edite opening_time / closing_time

### Adicionar novo servico
Table Editor > services > Insert Row > preencha shop_id, name, price, duration_minutes, active: true

### Ver todos os agendamentos de uma barbearia
Table Editor > appointments > Filter: shop_id = UUID da barbearia

### Ver comissoes do mes
Table Editor > appointments > Filter:
- shop_id = UUID da barbearia
- status in (done, finished)
- appointment_date >= primeiro dia do mes

---

## URLs do App

| URL | Descricao |
|-----|-----------|
| https://app.barberos.click/barberos-v2/?s=SLUG | App da barbearia (cliente) |
| https://app.barberos.click/barberos-v2/ | Tela de login admin |
| GitHub repo | github.com/barberospro/barberos-v2 |
