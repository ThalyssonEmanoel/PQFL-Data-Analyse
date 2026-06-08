<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import authService from "@/services/authService.js";
import { extractApiError } from "@/services/http.js";
import { useToast } from "@/composables/useToast.js";
import BaseButton from "@/components/ui/BaseButton.vue";

// Redefinicao de senha — usada tambem no PRIMEIRO ACESSO (o link de cadastro
// enviado pelo admin aponta para ca com ?token=...).
const route = useRoute();
const router = useRouter();
const toast = useToast();

const token = ref("");
const password = ref("");
const confirm = ref("");
const loading = ref(false);

onMounted(() => {
  token.value = typeof route.query.token === "string" ? route.query.token : "";
});

const tooShort = computed(() => password.value.length > 0 && password.value.length < 10);
const mismatch = computed(() => confirm.value.length > 0 && password.value !== confirm.value);
const canSubmit = computed(
  () => token.value && password.value.length >= 10 && password.value === confirm.value
);

async function onSubmit() {
  if (!canSubmit.value) return;
  loading.value = true;
  try {
    await authService.resetPassword({ token: token.value, newPassword: password.value });
    toast.success("Senha definida com sucesso! Faça login.");
    router.push({ name: "login" });
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
      <h2>Definir nova senha</h2>
      <p class="muted">Crie uma senha forte com no mínimo 10 caracteres.</p>

      <div v-if="!token" class="alert">
        Token ausente ou inválido. Abra o link enviado por e-mail novamente.
      </div>

      <form v-else @submit.prevent="onSubmit">
        <div class="field">
          <label for="pwd">Nova senha</label>
          <input id="pwd" v-model="password" type="password" class="input" placeholder="••••••••••" required />
          <small v-if="tooShort" class="hint hint--err">Mínimo de 10 caracteres.</small>
        </div>
        <div class="field">
          <label for="confirm">Confirmar senha</label>
          <input id="confirm" v-model="confirm" type="password" class="input" placeholder="••••••••••" required />
          <small v-if="mismatch" class="hint hint--err">As senhas não conferem.</small>
        </div>
        <BaseButton type="submit" block :loading="loading" :disabled="!canSubmit">Salvar senha</BaseButton>
      </form>

      <router-link to="/login" class="mini__back">← Voltar ao login</router-link>
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
.mini__card h2 {
  font-size: 1.4rem;
}
.mini__card form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
}
.mini__back {
  font-size: 0.84rem;
  color: var(--c-primary-dark);
  font-weight: 600;
  text-align: center;
}
.alert {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 11px 13px;
  border-radius: 10px;
  font-size: 0.86rem;
}
.hint--err {
  color: var(--c-danger);
  font-size: 0.78rem;
}
</style>
