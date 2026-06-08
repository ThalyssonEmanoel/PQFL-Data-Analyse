<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { useToast } from "@/composables/useToast.js";
import BaseButton from "@/components/ui/BaseButton.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");

async function onSubmit() {
  error.value = "";
  try {
    const user = await auth.login({ email: email.value, password: password.value });
    toast.success(`Bem-vindo(a), ${user.email}!`);
    const redirect = route.query.redirect;
    router.push(typeof redirect === "string" ? redirect : { name: "dashboard" });
  } catch (e) {
    error.value = e.message || "Não foi possível entrar.";
  }
}
</script>

<template>
  <div class="auth">
    <!-- Lado esquerdo: marca / contexto -->
    <aside class="auth__brand">
      <div class="auth__brand-inner">
        <span class="auth__logo">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
            <path d="M7 3h10l-1 4H8L7 3z" />
            <path d="M8 8h8v10a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V8z" opacity="0.85" />
          </svg>
        </span>
        <h1>PQFL Dashboard</h1>
        <p>
          Plano de Qualificação de Fornecedores de Leite. Acompanhe a pontuação,
          a classificação (G1, G2 e G3) e os planos de ação (PAE e PBPA) dos produtores.
        </p>
        <ul class="auth__features">
          <li><span class="dot dot--g1"></span> G1 — Excelência (≥ 80 pts)</li>
          <li><span class="dot dot--g2"></span> G2 — Em evolução (50–79 pts)</li>
          <li><span class="dot dot--g3"></span> G3 — Atenção (&lt; 50 pts)</li>
        </ul>
      </div>
    </aside>

    <!-- Lado direito: formulario -->
    <main class="auth__panel">
      <form class="auth__form" @submit.prevent="onSubmit">
        <h2>Entrar</h2>
        <p class="muted">Use as credenciais fornecidas pelo administrador.</p>

        <div v-if="error" class="alert">{{ error }}</div>

        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" class="input" placeholder="voce@pqfl.com" required autocomplete="username" />
        </div>

        <div class="field">
          <label for="password">Senha</label>
          <div class="pwd">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              placeholder="••••••••••"
              required
              autocomplete="current-password"
            />
            <button type="button" class="pwd__toggle" @click="showPassword = !showPassword">
              {{ showPassword ? "Ocultar" : "Mostrar" }}
            </button>
          </div>
        </div>

        <BaseButton type="submit" block :loading="auth.loading">Entrar</BaseButton>

        <div class="auth__links">
          <router-link to="/esqueci-senha">Esqueci minha senha</router-link>
        </div>
      </form>
      <p class="auth__copy muted">© {{ new Date().getFullYear() }} PQFL — Todos os direitos reservados.</p>
    </main>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
}
.auth__brand {
  background: linear-gradient(155deg, #0f172a 0%, #1d4a25 55%, #275f30 100%);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  padding: 56px;
  position: relative;
  overflow: hidden;
}
.auth__brand::after {
  content: "";
  position: absolute;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(164, 210, 51, 0.28), transparent 70%);
  bottom: -160px;
  right: -120px;
}
.auth__brand-inner {
  position: relative;
  z-index: 1;
  max-width: 420px;
}
.auth__logo {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  margin-bottom: 26px;
}
.auth__brand h1 {
  font-size: 2rem;
  color: #fff;
  margin-bottom: 14px;
}
.auth__brand p {
  line-height: 1.6;
  color: #c2d6c4;
}
.auth__features {
  list-style: none;
  margin: 30px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth__features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.92rem;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.dot--g1 {
  background: #16a34a;
}
.dot--g2 {
  background: #f59e0b;
}
.dot--g3 {
  background: #ef4444;
}
.auth__panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  gap: 30px;
}
.auth__form {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.auth__form h2 {
  font-size: 1.6rem;
}
.alert {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 11px 13px;
  border-radius: 10px;
  font-size: 0.86rem;
}
.pwd {
  position: relative;
}
.pwd__toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--c-primary-dark);
  font-size: 0.78rem;
  font-weight: 600;
}
.auth__links {
  display: flex;
  justify-content: center;
  font-size: 0.86rem;
}
.auth__links a {
  color: var(--c-primary-dark);
  font-weight: 600;
}
.auth__copy {
  font-size: 0.78rem;
}

@media (max-width: 860px) {
  .auth {
    grid-template-columns: 1fr;
  }
  .auth__brand {
    display: none;
  }
}
</style>
