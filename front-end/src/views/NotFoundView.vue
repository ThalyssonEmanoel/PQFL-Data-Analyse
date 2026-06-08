<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="nf">
    <div class="nf__card fade-up">
      <h1>404</h1>
      <h2>Página não encontrada</h2>
      <p class="muted">O endereço que você tentou acessar não existe ou foi movido.</p>
      <button class="cta" @click="router.push('/dashboard')">Voltar ao painel</button>
    </div>
  </div>
</template>

<style scoped>
.nf {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(160deg, #e9f3d6, #f1f5f9);
}
.nf__card {
  text-align: center;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 48px 40px;
  max-width: 420px;
}
.nf__card h1 {
  font-size: 4rem;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}
.nf__card h2 {
  margin-top: 8px;
  font-size: 1.3rem;
}
.nf__card p {
  margin-top: 8px;
}
.cta {
  margin-top: 22px;
  background: var(--c-primary);
  color: #fff;
  border: none;
  padding: 11px 22px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(39, 95, 48, 0.28);
}
</style>
