<div align="center">
  
# 🍽️ Restaurant Manager

**Веб-приложение для управления рестораном**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![MUI](https://img.shields.io/badge/Material_UI-5-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Статус-v0.1.0_в_разработке-orange?style=flat-square)]()
<br/>

---

## 📋 Содержание

| | | |
| :---: | :---: | :---: |
| [🎯 **О проекте**](#-о-проекте) | [✨ **Функционал**](#-текущий-функционал) | [🛠️ **Стек**](#-стек-технологий) |
| [🗄️ **База данных**](#-архитектура-бд) | [📂 **Структура**](#-структура-проекта) | [🚀 **Быстрый старт**](#-быстрый-старт) |
| [🐳 **Docker**](#-запуск-через-docker) | [🔑 **Конфиг**](#-переменные-окружения) | |

</div>

---

## 🎯 О проекте

**Restaurant Manager** — внутренняя система для автоматизации ресторана. Приложение строится поэтапно: в текущей версии реализована авторизация, управлением складом и меню.

---

## ✅ Текущий функционал

### Реализовано в `v0.1.0`

| Модуль | Что работает |
|---|---|
| 🔐 **Авторизация** | Регистрация, вход, выход. Сессия через Supabase Auth |
| 🛡️ **Защита роутов** | `PrivateRoute` с заглушкой под ролевую проверку |
| 🏗️ **Layout** | Адаптивный Sidebar + AppBar, мобильное меню |
| 📦 **Склад** | Список продуктов, текущий остаток, статус запасов |
| 🚚 **Поставки** | Модальное окно добавления поставки, автообновление остатка |
| 🍜 **Меню** | Карточки блюд с ценой, описанием и составом ингредиентов |
| 🗄️ **БД** | Полная схема с триггерами, RLS-политиками, связями |

### В разработке / заглушки

- Страница Dashboard (сводная статистика)
- Управление блюдами из интерфейса (CRUD)
- Создание/редактирование продуктов
- Ролевая модель (разные права для `chef` и `client`)

---

## 🛠️ Стек технологий

| Слой | Технология | Зачем |
|---|---|---|
| **Фронтенд** | React 18 + Vite | UI + молниеносная сборка |
| **UI Kit** | Material UI (MUI) v5 | Компоненты, тема, адаптивность |
| **Роутинг** | React Router v6 | SPA-навигация, вложенные роуты |
| **Бэкенд / БД** | Supabase (PostgreSQL) | Auth, хранение данных, RLS |
| **Деплой** | Docker + Nginx | Multi-stage сборка, продакшн |
| **Язык** | JavaScript (ES2022+) | — |

---

## 🗄️ Архитектура БД

```
auth.users  (Supabase встроенная)
     │
     │ триггер on_auth_user_created
     ▼
profiles ── id, email, full_name, role ('admin' | 'chef' | 'client')
     │
     │
products ── id, name, unit, quantity, min_stock
     │  ▲
     │  │ триггер: supplies → quantity += новая поставка
     │  │
supplies ── id, product_id, quantity, price_per_unit, supplier, arrived_at
     │
     │  M:N
     ▼
dishes ◄──── dish_ingredients ────► products
             (dish_id, product_id, quantity_per_serving)
```

### Таблицы

| Таблица | Описание |
|---|---|
| `profiles` | Профили пользователей, роли |
| `products` | Ингредиенты / товары на складе |
| `supplies` | История поставок |
| `dishes` | Блюда в меню |
| `dish_ingredients` | Рецепты: сколько какого продукта в блюде |

---

## 📁 Структура проекта

```
restaurant-app/
│
├── src/
│   ├── api/                    # Запросы к Supabase
│   │   ├── supabaseClient.js   # Инициализация клиента
│   │   ├── products.js         # CRUD продуктов
│   │   ├── supplies.js         # CRUD поставок
│   │   └── dishes.js           # CRUD блюд
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx     # Сессия, user, profile, role
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── LoadingScreen.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   ├── inventory/
│   │   │   ├── ProductsTable.jsx
│   │   │   └── AddSupplyModal.jsx
│   │   └── menu/
│   │       ├── DishCard.jsx
│   │       └── DishList.jsx
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── InventoryPage.jsx
│   │   └── MenuPage.jsx
│   │
│   ├── hooks/
│   │   └── useAuth.js
│   │
│   ├── theme/
│   │   └── theme.js            # MUI тема (цвета, шрифты, радиусы)
│   │
│   ├── App.jsx                 # Роутинг
│   └── main.jsx                # Точка входа
│
├── .env                        # 🔒 Локальные секреты (не в git)
├── .env.example                # Шаблон переменных окружения
├── .dockerignore
├── Dockerfile                  # Multi-stage: dev / production (Nginx)
├── docker-compose.yml          # Профили: dev / prod
└── vite.config.js
```

---

## 🚀 Быстрый старт

### Требования

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 9+
- Аккаунт на [Supabase](https://supabase.com/) (бесплатный)

### 1. Клонировать репозиторий

```bash
git clone https://github.com/zvshkin/restaurant-app.git
cd restaurant-app
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить Supabase

1. Создайте проект на [supabase.com](https://supabase.com/)
2. Перейдите в **Settings → API** и скопируйте:
   - **Project URL**
   - **anon public** ключ
3. В **SQL Editor** выполните скрипты из [`docs/database.sql`](docs/database.sql) — по порядку, блок за блоком
4. В **Authentication → Email** отключите *"Confirm email"* (для разработки)

### 4. Создать `.env`

```bash
cp .env.example .env
# Откройте .env и вставьте ваши ключи Supabase
```

### 5. Запустить

```bash
npm run dev
```

Откройте **http://localhost:5173** — приложение работает.

---

## 🐳 Запуск через Docker

### Разработка (с hot-reload)

```bash
docker compose --profile dev up --build
```

→ **http://localhost:5173**

### Production (Nginx)

```bash
docker compose --profile prod up --build
```

→ **http://localhost**

### Полезные команды

```bash
# Посмотреть логи
docker compose logs -f app-dev

# Зайти в контейнер
docker compose exec app-dev sh

# Остановить
docker compose --profile dev down

# Пересобрать без кеша
docker compose --profile dev build --no-cache
```

---

## 🔑 Переменные окружения

Создайте файл `.env` в корне проекта на основе `.env.example`:

```env
# Supabase — берётся из: Dashboard → Settings → API
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> ⚠️ Файл `.env` добавлен в `.gitignore` — никогда не коммитьте реальные ключи.  
> Для передачи ключей напарнику используйте защищённый канал (не git, не чат).

---

<div align="center">

*Restaurant Manager — v0.1.0*  
*Проект в активной разработке. Структура и API могут меняться.*

</div>