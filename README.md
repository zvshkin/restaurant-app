<div align="center">

# 🍽️ Restaurant Manager

**Веб-приложение для управления рестораном с клиентским меню и ИИ-консультантом**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![MUI](https://img.shields.io/badge/Material_UI-9-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI_Agents-MCP-412991?style=flat-square&logo=openai&logoColor=white)](https://platform.openai.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Статус-v1.0.0-success?style=flat-square)]()

<br/>

*Система учёта склада, управления меню, клиентских заказов и ИИ-ассистента по меню.*

---

## 📋 Содержание

| | | |
| :---: | :---: | :---: |
| [🎯 О проекте](#-о-проекте) | [✨ Функционал](#-функционал-v100) | [🛠️ Стек](#-стек-технологий) |
| [🗄️ База данных](#-архитектура-бд) | [📂 Структура](#-структура-проекта) | [🚀 Быстрый старт](#-быстрый-старт) |
| [🤖 ИИ-агент](#-ии-агент-mcp--openai) | [🔑 Ключи и .env](#-ключи-и-переменные-окружения) | [🐳 Docker](#-запуск-через-docker) |

</div>

---

## 🎯 О проекте

**Restaurant Manager** — полнофункциональная система для ресторана:

- **Персонал** (`director`, `admin`, `chef`) — склад, меню, поставки, заявки, пользователи.
- **Клиенты** (`client`) — публичное меню, корзина, заказы, избранное, профиль.
- **Гости** — просмотр меню без регистрации; заказ и ИИ-помощник доступны после входа.

В **v1.0.0** добавлен **ИИ-консультант**: OpenAI Agents + MCP-сервер, который читает актуальное меню из Supabase и может оформить заказ прямо из чата.

---

## ✨ Функционал v1.0.0

### 🔐 Авторизация и роли

| Роль | Доступ |
|---|---|
| `director` / `admin` | Полный доступ: склад, меню, заявки, пользователи, история поставок |
| `chef` | Склад, меню, заявки на поставку |
| `client` | Клиентское меню, корзина, заказы, профиль, ИИ-помощник |
| `guest` (анонимный) | Просмотр меню; заказ и ИИ — только после регистрации/входа |

### 📦 Склад и поставки

- CRUD продуктов, категории, условия хранения, срок годности
- Поставки с автообновлением остатков (триггер БД)
- Заявки поваров на пополнение склада с подтверждением администратора
- История поставок

### 🍜 Меню

- CRUD блюд с рецептами (`dish_ingredients`)
- КБЖУ, теги, вес порции, время приготовления
- Фильтры: категория, цена, теги, поиск
- Клиентская витрина с избранным и корзиной

### 🛒 Заказы

- Оформление через корзину (`orders` + `order_items`)
- Фиксация цены на момент заказа (`price_at_order`)
- ИИ-ассистент может создать заказ через MCP-инструмент `create_restaurant_order`

### 🤖 ИИ-консультант

- Плавающая кнопка (FAB) в интерфейсе клиента
- Чат с OpenAI-агентом на русском языке
- Консультация по меню (калории, теги, рекомендации)
- Автоматическое оформление заказа через MCP + Supabase
- Заблокирован для гостей (`GuestGuard`-логика)

---

## 🛠️ Стек технологий

| Слой | Технология | Назначение |
|---|---|---|
| **Фронтенд** | React 19 + Vite 8 | SPA, hot-reload |
| **UI** | Material UI (MUI) v9 | Компоненты, тема, адаптивность |
| **Роутинг** | React Router v7 | Защищённые маршруты по ролям |
| **БД / Auth** | Supabase (PostgreSQL) | Данные, Auth, RLS |
| **ИИ** | OpenAI Agents SDK + MCP | Агент-консультант, инструменты |
| **MCP-сервер** | `@modelcontextprotocol/sdk` | Resource (меню) + Tool (заказ) |
| **Agent API** | Express (Node.js) | Прокси между React и OpenAI |
| **Деплой** | Docker + Nginx | Multi-stage сборка |

---

## 🗄️ Архитектура БД

```
auth.users
     │  on_auth_user_created
     ▼
profiles ── email, full_name, role, phone, avatar_url, bio, birth_date

products ◄── supplies          supply_requests
     ▲
     │
dishes ◄── dish_ingredients ──► products
  │
  ├── favorites (user_id, dish_id)
  └── order_items ──► orders (user_id, status, total_price, notes)
```

| Таблица | Описание |
|---|---|
| `profiles` | Профили, роли (`director`, `admin`, `chef`, `client`) |
| `products` | Ингредиенты / товары на складе |
| `supplies` | История поставок |
| `supply_requests` | Заявки поваров на пополнение |
| `dishes` | Блюда: цена, КБЖУ, теги, категория, `is_active` |
| `dish_ingredients` | Рецепты |
| `favorites` | Избранные блюда клиентов |
| `orders` | Заголовки заказов |
| `order_items` | Позиции заказа с `price_at_order` |

SQL-скрипт:

- [`docs/database.sql`](docs/database.sql) — базовая схема

---

## 📁 Структура проекта

```
restaurant-app/
│
├── src/                          # React-приложение
│   ├── api/
│   │   ├── supabaseClient.js     # Supabase-клиент (anon key)
│   │   ├── dishes.js, orders.js, favorites.js, …
│   │   └── aiAgent.js            # Клиент API ИИ-агента
│   ├── components/
│   │   ├── client/
│   │   │   ├── CartDrawer.jsx
│   │   │   └── AiAssistantDrawer.jsx   # Чат с ИИ
│   │   ├── common/               # PrivateRoute, GuestGuard, …
│   │   ├── layout/               # Sidebar, TopBar, AppLayout
│   │   ├── menu/                 # DishCard, DishFormModal, …
│   │   └── inventory/
│   ├── contexts/
│   │   ├── AuthContext.jsx       # useAuth(): user, role, isGuest
│   │   ├── CartContext.jsx
│   │   └── NotificationContext.jsx
│   ├── pages/
│   │   ├── client/ClientMenuPage.jsx
│   │   ├── admin/, dashboard/, …
│   └── App.jsx
│
├── ai-agent/                     # MCP-сервер + OpenAI Agent + HTTP API
│   ├── src/
│   │   ├── mcp/                  # MCP Resource + Tool
│   │   ├── db/                   # Supabase + PostgreSQL (транзакции)
│   │   ├── agent/                # Конфиг агента, init, chat CLI
│   │   └── api/httpServer.ts     # REST API для React (порт 3002)
│   ├── docs/schema.sql
│   └── .env.example
│
├── docs/database.sql
├── .env.example                  # Ключи фронтенда
├── docker-compose.yml
└── vite.config.js                # Прокси /api/agent → :3002
```

---

## 🚀 Быстрый старт

### Требования

- [Node.js](https://nodejs.org/) **18+**
- [npm](https://www.npmjs.com/) **9+**
- Аккаунт [Supabase](https://supabase.com/)
- Аккаунт [OpenAI](https://platform.openai.com/) с API-ключом (для ИИ)

### 1. Клонировать и установить

```bash
git clone https://github.com/zvshkin/restaurant-app.git
cd restaurant-app

npm install
cd ai-agent && npm install && cd ..
```

### 2. Настроить Supabase

1. Создайте проект на [supabase.com](https://supabase.com/)
2. **SQL Editor** → выполните [`docs/database.sql`](docs/database.sql)
3. При необходимости → [`ai-agent/docs/schema.sql`](ai-agent/docs/schema.sql) (заказы, КБЖУ)
4. **Authentication → Email** → отключите *Confirm email* (для разработки)

### 3. Заполнить `.env` файлы

Подробная инструкция — в разделе [🔑 Ключи и переменные окружения](#-ключи-и-переменные-окружения).

```bash
cp .env.example .env
cp ai-agent/.env.example ai-agent/.env
# Отредактируйте оба файла
```

### 4. Запустить (два терминала)

**Терминал 1 — API ИИ-агента:**

```bash
cd ai-agent
npm run api
# → http://localhost:3002
```

**Терминал 2 — фронтенд:**

```bash
npm run dev
# → http://localhost:5173
```

### 5. Проверка

| Шаг | Ожидание |
|---|---|
| Открыть `/menu` | Клиентское меню |
| Войти как `client` | Доступна корзина и FAB «ИИ-консультант» |
| Написать в чат | Ответ на русском с рекомендациями из меню |
| «Хочу заказать …» | Агент оформляет заказ, зелёное системное сообщение в чате |

---

## 🤖 ИИ-агент (MCP + OpenAI)

### Архитектура

```
React (AiAssistantDrawer)
    │  JWT Supabase
    ▼
Agent API (Express :3002)
    │  OpenAI Agents SDK
    ▼
MCP Server (stdio)
    ├── Resource: restaurant://menu/active-dishes  → SELECT dishes
    └── Tool: create_restaurant_order              → INSERT orders (транзакция)
```

### Команды `ai-agent/`

| Команда | Описание |
|---|---|
| `npm run api` | HTTP API для React (**обязательно для чата**) |
| `npm run mcp` | MCP-сервер в режиме stdio (отладка) |
| `npm run mcp:http` | MCP через Streamable HTTP (:3001) |
| `npm run agent:init` | Проверка подключения MCP + сохранение `agent.config.json` |
| `npm run agent:chat` | CLI-чат в терминале |

### Ограничения

- **Гости** не могут использовать ИИ (403 на API + UI-блокировка).
- **`service_role`** и **`OPENAI_API_KEY`** — только на сервере (`ai-agent/.env`), **никогда** во фронтенде.
- Для транзакций заказов нужен **`DATABASE_URL`** (прямое подключение PostgreSQL).

---

## 🔑 Ключи и переменные окружения

> ⚠️ Файлы `.env` в `.gitignore`. **Не коммитьте** реальные ключи.

### Сводная таблица

| Переменная | Файл | Откуда взять | Зачем |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (корень) | Supabase → **Settings → API → Project URL** | Фронтенд: Auth, CRUD |
| `VITE_SUPABASE_ANON_KEY` | `.env` (корень) | Supabase → **Settings → API → anon public** | Фронтенд: публичный ключ |
| `VITE_AI_AGENT_API_URL` | `.env` (корень) | *опционально* | URL API агента; по умолчанию прокси Vite |
| `SUPABASE_URL` | `ai-agent/.env` | **Тот же** Project URL | MCP/API: чтение меню |
| `SUPABASE_SERVICE_ROLE_KEY` | `ai-agent/.env` | Supabase → **Settings → API → service_role** ⚠️ | MCP/API: обход RLS, проверка JWT |
| `DATABASE_URL` | `ai-agent/.env` | Supabase → **Settings → Database → Connection string → URI** (Transaction pooler, порт **6543**) | Транзакции заказов через `pg` |
| `OPENAI_API_KEY` | `ai-agent/.env` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | OpenAI Agents SDK |
| `OPENAI_MODEL` | `ai-agent/.env` | Например `gpt-4.1` | Модель агента |
| `AGENT_API_PORT` | `ai-agent/.env` | По умолчанию `3002` | Порт Express API |

### `.env` — корень проекта (фронтенд)

```env
# Supabase → Settings → API
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Необязательно: если API агента на другом хосте (без Vite-прокси)
# VITE_AI_AGENT_API_URL=https://your-server.com/api/agent
```

**Где взять Supabase-ключи:**

1. [supabase.com](https://supabase.com/) → ваш проект
2. **Settings** (⚙️) → **API**
3. **Project URL** → `VITE_SUPABASE_URL` и `SUPABASE_URL`
4. **Project API keys → anon public** → `VITE_SUPABASE_ANON_KEY`
5. **Project API keys → service_role** → `SUPABASE_SERVICE_ROLE_KEY` *(только `ai-agent/.env`!)*

### `ai-agent/.env` — сервер ИИ

```env
# Тот же Project URL
SUPABASE_URL=https://xxxxxxxx.supabase.co

# service_role — СЕКРЕТНЫЙ, только сервер
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database → Connection string → URI (Transaction pooler)
DATABASE_URL=postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# OpenAI → API Keys
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4.1

# Порт REST API для React (по умолчанию 3002)
AGENT_API_PORT=3002
```

**Где взять `DATABASE_URL`:**

1. Supabase → **Settings → Database**
2. **Connection string** → вкладка **URI**
3. Режим: **Transaction pooler** (порт **6543**)
4. Подставьте пароль БД (тот, что задавали при создании проекта, или сбросьте в **Database → Database password**)

**Где взять `OPENAI_API_KEY`:**

1. [platform.openai.com](https://platform.openai.com/)
2. **API keys → Create new secret key**
3. Скопируйте в `ai-agent/.env` (ключ показывается один раз)

### Чеклист перед первым запуском

- [ ] Supabase: выполнены SQL-скрипты, есть таблицы `orders`, `order_items`, `dishes` с КБЖУ
- [ ] `.env` в корне: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] `ai-agent/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`
- [ ] `cd ai-agent && npm run api` — сервер отвечает на `http://localhost:3002/health`
- [ ] `npm run dev` — фронт на `http://localhost:5173`
- [ ] Зарегистрирован пользователь с ролью `client` (или измените роль в таблице `profiles`)

---

## 🐳 Запуск через Docker

```bash
# Разработка (только фронтенд, hot-reload)
docker compose --profile dev up --build
# → http://localhost:5173

# Production (Nginx)
docker compose --profile prod up --build
# → http://localhost
```

> **Примечание:** Docker-профили пока поднимают только React-приложение.  
> Для ИИ-чата дополнительно запустите `ai-agent` на хосте или добавьте сервис в `docker-compose.yml`.

```bash
docker compose logs -f app-dev
docker compose --profile dev down
```

---

## 🧪 Полезные команды

```bash
# Фронтенд
npm run dev          # разработка
npm run build        # production-сборка
npm run lint         # ESLint

# ИИ-агент (из папки ai-agent/)
npm run api          # REST API для React
npm run agent:init   # проверка MCP + конфиг
npm run agent:chat -- "Что есть из вегетарианского?"
npm run build        # компиляция TypeScript
```

---

<div align="center">

**Restaurant Manager — v1.0.0**

*Система управления рестораном с клиентским меню, заказами и ИИ-консультантом.*

</div>
