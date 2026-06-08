<script setup>
import { ref } from "vue";
import suppliersService from "@/services/suppliersService.js";
import authService from "@/services/authService.js";
import { extractApiError } from "@/services/http.js";
import { useToast } from "@/composables/useToast.js";
import { formatDateTime } from "@/utils/format.js";

import BaseCard from "@/components/ui/BaseCard.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

// Acoes restritas a administradores. As rotas correspondentes no back-end exigem
// authorize('admin'); aqui a UI tambem so e exibida para admin (guard de rota).
const toast = useToast();

const busy = ref({ calculate: false, pullAll: false, pullPartial: false, register: false });
const lastOps = ref([]); // historico de operacoes nesta sessao

function logOp(title, detail) {
  lastOps.value.unshift({ title, detail, at: new Date().toISOString() });
  lastOps.value = lastOps.value.slice(0, 8);
}

async function runCalculate() {
  busy.value.calculate = true;
  try {
    const res = await suppliersService.calculateAll();
    const r = res?.result || {};
    toast.success(`Cálculo concluído: ${r.processed ?? 0} processados.`);
    logOp("Recálculo de pontuações", `processados: ${r.processed ?? 0} · G1: ${r.groups?.G1 ?? 0} · G2: ${r.groups?.G2 ?? 0} · G3: ${r.groups?.G3 ?? 0} · PAE: ${r.inPAECount ?? 0}`);
  } catch (e) {
    toast.error(extractApiError(e).message);
  } finally {
    busy.value.calculate = false;
  }
}

async function runPullAll() {
  busy.value.pullAll = true;
  try {
    const res = await suppliersService.pullAll();
    toast.success(res?.message || "Sincronização completa concluída.");
    logOp("Sincronização completa (Coletum)", JSON.stringify(res?.sync ?? {}));
  } catch (e) {
    toast.error(extractApiError(e).message);
  } finally {
    busy.value.pullAll = false;
  }
}

async function runPullPartial() {
  busy.value.pullPartial = true;
  try {
    const res = await suppliersService.pullPartial();
    toast.success(res?.message || "Sincronização incremental concluída.");
    logOp("Sincronização incremental (Coletum)", JSON.stringify(res?.sync ?? {}));
  } catch (e) {
    toast.error(extractApiError(e).message);
  } finally {
    busy.value.pullPartial = false;
  }
}

// Cadastro de usuario
const newEmail = ref("");
const newRole = ref("member");

async function registerUser() {
  if (!newEmail.value) return;
  busy.value.register = true;
  try {
    const user = await authService.register({ email: newEmail.value, role: newRole.value });
    toast.success(`Usuário ${user.email} cadastrado. Um e-mail de primeiro acesso foi enviado.`);
    logOp("Cadastro de usuário", `${user.email} (${user.role})`);
    newEmail.value = "";
    newRole.value = "member";
  } catch (e) {
    toast.error(extractApiError(e).message);
  } finally {
    busy.value.register = false;
  }
}
</script>

<template>
  <div class="admin">
    <div>
      <h2>Administração</h2>
      <p class="muted">Operações sensíveis: cálculo, sincronização com o Coletum e cadastro de usuários.</p>
    </div>

    <div class="grid grid-2">
      <!-- Calculo -->
      <BaseCard title="Pontuações" subtitle="Recalcula e persiste a classificação de todos os fornecedores">
        <p class="muted txt">
          Reprocessa todos os fornecedores do banco aplicando as regras BPA, define grupo (G1/G2/G3)
          e gera os planos PAE/PBPA. Use após uma sincronização.
        </p>
        <BaseButton :loading="busy.calculate" @click="runCalculate">Recalcular pontuações</BaseButton>
      </BaseCard>

      <!-- Sincronizacao -->
      <BaseCard title="Sincronização com o Coletum" subtitle="Importa as respostas do formulário de origem">
        <p class="muted txt">
          <strong>Completa</strong>: importa todos os registros. <strong>Incremental</strong>: importa
          apenas o que mudou desde a última sincronização (mais rápida).
        </p>
        <div class="flex gap-sm wrap">
          <BaseButton :loading="busy.pullPartial" @click="runPullPartial">Incremental (delta)</BaseButton>
          <BaseButton variant="ghost" :loading="busy.pullAll" @click="runPullAll">Completa</BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Cadastro de usuario -->
    <BaseCard title="Cadastrar usuário" subtitle="Cria a conta e envia o link de primeiro acesso por e-mail">
      <form class="user-form" @submit.prevent="registerUser">
        <div class="field grow">
          <label for="nemail">E-mail</label>
          <input id="nemail" v-model="newEmail" type="email" class="input" placeholder="novo.usuario@pqfl.com" required />
        </div>
        <div class="field">
          <label for="nrole">Papel</label>
          <select id="nrole" v-model="newRole" class="input">
            <option value="member">Membro</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <BaseButton type="submit" :loading="busy.register">Cadastrar</BaseButton>
      </form>
    </BaseCard>

    <!-- Historico de operacoes da sessao -->
    <BaseCard v-if="lastOps.length" title="Operações recentes" subtitle="Histórico desta sessão">
      <ul class="ops">
        <li v-for="(op, i) in lastOps" :key="i">
          <div>
            <strong>{{ op.title }}</strong>
            <small class="muted mono">{{ op.detail }}</small>
          </div>
          <span class="muted">{{ formatDateTime(op.at) }}</span>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.admin h2 {
  font-size: 1.45rem;
}
.txt {
  font-size: 0.88rem;
  line-height: 1.55;
  margin-bottom: 16px;
}
.user-form {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.user-form .field {
  min-width: 160px;
}
.ops {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ops li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--c-surface-2);
  border-radius: 10px;
  font-size: 0.85rem;
}
.ops li div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ops li small {
  font-size: 0.76rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60vw;
}
</style>
