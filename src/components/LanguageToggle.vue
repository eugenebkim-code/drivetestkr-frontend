<script setup lang="ts">
import { language } from "../store/language";
</script>

<template>
  <div class="lang-toggle" role="group" aria-label="Язык вопросов">
    <button
      type="button"
      class="lang-toggle-option"
      :class="{ active: language.state.lang === 'ru' }"
      @click="language.set('ru')"
    >
      RU
    </button>
    <button
      type="button"
      class="lang-toggle-option"
      :class="{ active: language.state.lang === 'en' }"
      @click="language.set('en')"
    >
      EN
    </button>
  </div>
</template>
