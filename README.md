<div align="center">

# 🍽️ Restaurant Manager

**Веб-приложение для управления рестораном**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![MUI](https://img.shields.io/badge/Material_UI-5-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Статус-v0.2.0_в_разработке-orange?style=flat-square)]()

<br/>

*Система учёта склада, управления меню и авторизации персонала ресторана.*
*Архитектура заложена под ролевую модель и расширенный функционал.*

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

**Restaurant Manager** — внутренняя система для автоматизации ресторана. Приложение строится поэтапно: в текущей версии реализована авторизация, управлением продуктами/блюдами.

---

## ✅ Текущий функционал

### Реализовано в `v0.2.0`

| Модуль | Что работает |
|---|---|
| 🔐 **Авторизация** | Регистрация, вход, выход. Сессия через Supabase Auth |
| 🛡️ **Защита роутов** | `PrivateRoute` с заглушкой под ролевую проверку |
| 🔔 **Уведомления** | Глобальная toast-система: success / error / warning / info, до 3 одновременно, автозакрытие |
| 🏗️ **Layout** | Адаптивный Sidebar + AppBar, мобильное меню-бургер |
| 📦 **Склад — просмотр** | Таблица продуктов с остатком и статусом «Мало» / «ОК» |
| ➕ **Склад — CRUD** | Создание, редактирование и удаление продуктов |
| 🚚 **Поставки** | Добавление поставки с автообновлением остатка (триггер БД) |
| 🍜 **Меню — просмотр** | Карточки блюд с ценой, категорией, описанием и составом |
| ✏️ **Меню — CRUD** | Создание, редактирование и удаление блюд |
| 🧪 **Конструктор рецептов** | Динамическое добавление ингредиентов с защитой от дублей и автоопределением единиц |
| 🗄️ **БД** | Полная схема с триггерами, RLS-политиками, каскадными удалениями |

### В разработке / следующий этап

- Система ролей `admin` / `chef` / `client` с реальным разграничением прав в UI
- Админ-панель: управление пользователями, выдача ролей
- Профили пользователей с редактируемыми полями
- Расширенные карточки продуктов: категории, условия хранения, срок годности
- КБЖУ и теги для блюд, фильтры на странице меню
- Заявки на поставку от поваров с подтверждением администратора

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

products ── id, name, unit, quantity, min_stock
     │  ▲
     │  │ триггер: supplies → quantity += новая поставка
     │  │
supplies ── id, product_id, quantity, price_per_unit, supplier, arrived_at

dishes ◄──── dish_ingredients ────► products
             (dish_id, product_id, quantity_per_serving)
             ON DELETE CASCADE на dish_id
```

| Таблица | Описание |
|---|---|
| `profiles` | Профили пользователей, роли |
| `products` | Ингредиенты / товары на складе |
| `supplies` | История поставок |
| `dishes` | Блюда в меню с категорией и флагом активности |
| `dish_ingredients` | Рецепты: количество каждого продукта на порцию |

---

## 📁 Структура проекта

```
restaurant-app/
│
├── src/
│   ├── api/
│   │   ├── supabaseClient.js        # Инициализация клиента
│   │   ├── products.js              # CRUD продуктов
│   │   ├── supplies.js              # CRUD поставок
│   │   └── dishes.js                # CRUD блюд + рецептов
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx          # Сессия, user, profile, role
│   │   └── NotificationContext.jsx  # Глобальные toast-уведомления
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── PrivateRoute.jsx         # Защита роутов (+ заглушка ролей)
│   │   │   ├── LoadingScreen.jsx
│   │   │   └── DeleteConfirmDialog.jsx  # Переиспользуемый диалог удаления
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   ├── inventory/
│   │   │   ├── AddSupplyModal.jsx    # Модалка добавления поставки
│   │   │   └── ProductFormModal.jsx  # Модалка создания/редактирования продукта
│   │   └── menu/
│   │       ├── DishCard.jsx          # Карточка блюда с action-кнопками
│   │       └── DishFormModal.jsx     # Конструктор блюда с составом
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
│   │   └── theme.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env                             # 🔒 Локальные секреты (не в git)
├── .env.example
├── .dockerignore
├── Dockerfile                       # Multi-stage: dev / production (Nginx)
├── docker-compose.yml               # Профили: dev / prod
├── CHANGELOG.md
├── ROADMAP.md
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
2. Перейдите в **Settings → API** и скопируйте **Project URL** и **anon public** ключ
3. В **SQL Editor** выполните скрипты из [`docs/database.sql`](docs/database.sql) — по порядку
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

Откройте **http://localhost:5173**

---

## 🐳 Запуск через Docker

```bash
# Разработка (hot-reload)
docker compose --profile dev up --build
# → http://localhost:5173

# Production (Nginx)
docker compose --profile prod up --build
# → http://localhost

# Полезные команды
docker compose logs -f app-dev          # логи
docker compose exec app-dev sh          # зайти в контейнер
docker compose --profile dev down       # остановить
docker compose --profile dev build --no-cache  # пересобрать без кеша
```

---

## 🔑 Переменные окружения

```env
# Supabase — берётся из: Dashboard → Settings → API
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> ⚠️ Файл `.env` добавлен в `.gitignore` — никогда не коммитьте реальные ключи.

---

<div align="center">

*Restaurant Manager — v0.2.0*  
*Проект в активной разработке. Структура и API могут меняться.*

</div>
