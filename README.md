# MyPlanner — Личный планировщик

Веб-приложение для планирования дня, трекинга привычек и целей.

## Технологии

- **Frontend:** React + Vite
- **База данных:** Supabase (PostgreSQL)
- **Деплой:** Vercel
- **CI/CD:** GitHub → Vercel (автодеплой при push)

## Локальная разработка

```bash
# Установить зависимости
npm install

# Создать файл с переменными окружения
cp .env.example .env.local
# Заполнить VITE_SUPABASE_URL и VITE_SUPABASE_KEY

# Запустить dev сервер
npm run dev
```

## Деплой

Деплой происходит автоматически при push в ветку `main`.

```bash
git add .
git commit -m "feat: описание изменений"
git push
```

## Структура проекта

```
src/
├── App.jsx        — основной компонент
└── main.jsx       — точка входа
```

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `VITE_SUPABASE_URL` | URL Supabase проекта |
| `VITE_SUPABASE_KEY` | Anon ключ Supabase |
