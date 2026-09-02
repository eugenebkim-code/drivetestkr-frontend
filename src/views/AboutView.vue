<script setup lang="ts">
import { useBackToHome } from "../composables/useBackToHome";

useBackToHome();

const modes = [
  {
    icon: "📘",
    color: "#3b82f6",
    title: "Обучение",
    text: "Все вопросы базы данных с правильными ответами, показанными сразу, и краткими «якорными фразами» для более быстрого запоминания — на русском и английском языках. Прогресс запоминается: при следующем открытии обучение продолжится с того же вопроса, на котором вы остановились.",
  },
  {
    icon: "🔥",
    color: "#f97316",
    title: "Интенсив",
    text: "200 случайных вопросов подряд для более динамичной тренировки, без подсказок и объяснений. Доступен только при полном доступе (пробный период или подписка). Точность ваших ответов сохраняется и показывается в личном кабинете отдельно по каждой неделе.",
  },
  {
    icon: "📝",
    color: "#10b981",
    title: "Экзамен",
    text: "Симуляция реального экзамена на права: 40 случайных вопросов и 30 минут на прохождение — ровно как на настоящем корейском экзамене. Обратный отсчёт времени виден на экране и становится красным в последние 5 минут. По истечении времени экзамен завершается автоматически с уже данными ответами «как есть» — неотвеченные вопросы засчитываются как неправильные. Для сдачи нужно набрать не менее 60 баллов из 100. После завершения показывается разбор по каждому вопросу.",
  },
];

const navigation = [
  "Свайп влево/вправо или стрелки по бокам экрана — переход между вопросами в «Обучении» и «Интенсиве».",
  "Переключатель RU / EN — язык вопросов и ответов, виден на всех экранах с вопросами.",
  "Переключатель «Якоря» (в «Обучении») — показывает или скрывает короткие подсказки для запоминания.",
  "Кнопка «На главную» и системная кнопка «назад» Telegram (стрелка сверху) — быстрый возврат на главный экран из любого режима.",
];

const cabinet = [
  {
    icon: "🔥",
    title: "Стрик — дни подряд",
    text: "Кнопка «Отметиться сегодня» засчитывает день; если отмечаться каждый день без пропуска, счётчик растёт. Пропуск дня обнуляет стрик.",
  },
  {
    icon: "🎯",
    title: "Дневная цель",
    text: "Выбор количества вопросов в день — 20, 30, 100 или своё число — с прогресс-баром, показывающим, сколько уже пройдено сегодня.",
  },
  {
    icon: "📊",
    title: "Точность в «Интенсиве» по неделям",
    text: "Горизонтальные полоски, по одной на каждую неделю (новая — сверху): красная заливка растёт слева направо ровно на процент правильных ответов за эту неделю, рядом — сам процент и число отвеченных вопросов.",
  },
  {
    icon: "🗂",
    title: "История экзаменов",
    text: "Список всех пройденных попыток экзамена — результат (сдано/не сдано), баллы и дата.",
  },
];
</script>

<template>
  <div class="screen">
    <div class="profile-hero">
      <div class="profile-hero-glow" />
      <p class="home-hero-eyebrow">О приложении</p>
      <h1 class="home-hero-title" style="position: relative">ПРАВА В КОРЕЕ</h1>
      <p class="profile-hero-caption">
        Подготовка к экзамену на водительские права в Корее — прямо в Telegram
      </p>
    </div>

    <section>
      <p class="section-label">Режимы</p>
      <div class="mode-list">
        <div v-for="mode in modes" :key="mode.title" class="mode-row" style="align-items: flex-start">
          <span
            class="mode-icon"
            :style="{ background: `color-mix(in srgb, ${mode.color} 22%, transparent)` }"
            >{{ mode.icon }}</span
          >
          <span class="mode-row-text">
            <span class="mode-row-title">{{ mode.title }}</span>
            <span class="mode-row-subtitle">{{ mode.text }}</span>
          </span>
        </div>
      </div>
    </section>

    <section>
      <p class="section-label">Навигация</p>
      <div class="card glass">
        <ul class="about-list">
          <li v-for="item in navigation" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <section>
      <p class="section-label">Личный кабинет</p>
      <div class="mode-list">
        <div v-for="item in cabinet" :key="item.title" class="mode-row" style="align-items: flex-start">
          <span class="mode-icon" style="background: color-mix(in srgb, #64748b 22%, transparent)">{{
            item.icon
          }}</span>
          <span class="mode-row-text">
            <span class="mode-row-title">{{ item.title }}</span>
            <span class="mode-row-subtitle">{{ item.text }}</span>
          </span>
        </div>
      </div>
    </section>

    <section>
      <p class="section-label">Доступ</p>
      <div class="card glass">
        <p class="about-access-p">
          Новым пользователям при первом открытии приложения автоматически даётся
          <strong>полный доступ на 3 дня</strong> — без ограничений: «Интенсив», безлимитные вопросы и
          экзамены.
        </p>
        <p class="about-access-p">
          После этого действует бесплатный лимит: 30 случайных вопросов в «Обучении» в день и 1
          бесплатная попытка экзамена. «Интенсив» в бесплатном режиме недоступен.
        </p>
        <p class="about-access-p" style="margin-bottom: 0">
          Полный доступ на неделю или месяц можно приобрести у разработчика приложения — напишите
          <strong>@luv2win</strong>, либо введите готовый код доступа на главном экране.
        </p>
      </div>
    </section>
  </div>
</template>
