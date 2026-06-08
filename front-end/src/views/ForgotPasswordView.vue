<script setup>
import { ref } from "vue";
import authService from "@/services/authService.js";
import { extractApiError } from "@/services/http.js";
import { useToast } from "@/composables/useToast.js";
import BaseButton from "@/components/ui/BaseButton.vue";

const toast = useToast();
const email = ref("");
const loading = ref(false);
const sent = ref(false);

async function onSubmit() {
  loading.value = true;
  try {
    await authService.forgotPassword({ email: email.value });
    // O back-end responde sempre de forma generica (nao revela existencia da conta).
    sent.value = true;
    toast.success("Se a conta existir, um e-mail com instruções foi enviado.");
  } catch (e) {
    toast.error(extractApiError(e).message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mini">
    <div class="mini__card fade-up">
      <router-link to="/login" class="mini__back">← Voltar ao login</router-link>
      <h2>Recuperar senha</h2>
      <p class="muted">Informe seu e-mail e enviaremos um link para redefinir a senha.</p>

      <template v-if="!sent">
        <form @submit.prevent="onSubmit">
          <div class="field">
            <label for="email">E-mail</label>
            <input id="email" v-model="email" type="email" class="input" placeholder="voce@pqfl.com" required />
          </div>
          <BaseButton type="submit" block :loading="loading">Enviar link</BaseButton>
        </form>
      </template>

      <div v-else class="mini__done">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
        <p>Verifique sua caixa de entrada e siga as instruções do e-mail.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(160deg, #e9f3d6, #f1f5f9);
}
.mini__card {
  width: 100%;
  max-width: 410px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mini__back {
  font-size: 0.84rem;
  color: var(--c-primary-dark);
  font-weight: 600;
}
.mini__card h2 {
  font-size: 1.4rem;
}
.mini__card form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
}
.mini__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 16px 0;
  color: var(--c-text-soft);
}
</style>
