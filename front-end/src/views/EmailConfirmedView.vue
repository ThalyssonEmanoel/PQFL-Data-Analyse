<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

// Destino do redirect do back-end em GET /auth/confirmEmail
//   -> ${FRONT_URL}/email-confirmed?status=success|error
const route = useRoute();
const success = computed(() => route.query.status === "success");
</script>

<template>
  <div class="mini">
    <div class="mini__card fade-up">
      <div :class="['badge', success ? 'badge--ok' : 'badge--err']">
        <svg v-if="success" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </div>

      <h2>{{ success ? "E-mail confirmado!" : "Falha na confirmação" }}</h2>
      <p class="muted">
        {{
          success
            ? "Seu e-mail foi confirmado com sucesso. Agora você já pode acessar o painel."
            : "O link de confirmação é inválido ou expirou. Solicite um novo e-mail de confirmação."
        }}
      </p>

      <router-link to="/login" class="cta">Ir para o login</router-link>
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
  max-width: 420px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 40px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.badge {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
}
.badge--ok {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}
.badge--err {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.mini__card h2 {
  font-size: 1.4rem;
}
.cta {
  margin-top: 8px;
  background: var(--c-primary);
  color: #fff;
  padding: 11px 22px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(39, 95, 48, 0.28);
}
</style>
