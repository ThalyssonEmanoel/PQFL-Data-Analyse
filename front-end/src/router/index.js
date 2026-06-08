import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

// Lazy-loading das views (code-splitting por rota).
const LoginView = () => import("@/views/LoginView.vue");
const ForgotPasswordView = () => import("@/views/ForgotPasswordView.vue");
const ResetPasswordView = () => import("@/views/ResetPasswordView.vue");
const EmailConfirmedView = () => import("@/views/EmailConfirmedView.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const ProducersView = () => import("@/views/ProducersView.vue");
const ProducerDetailView = () => import("@/views/ProducerDetailView.vue");
const AdminView = () => import("@/views/AdminView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

const routes = [
  { path: "/", redirect: "/dashboard" },

  // --- Publicas / convidado ---
  { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true, layout: "blank" } },
  { path: "/esqueci-senha", name: "forgot-password", component: ForgotPasswordView, meta: { guestOnly: true, layout: "blank" } },
  { path: "/reset-senha", name: "reset-password", component: ResetPasswordView, meta: { public: true, layout: "blank" } },
  { path: "/email-confirmed", name: "email-confirmed", component: EmailConfirmedView, meta: { public: true, layout: "blank" } },

  // --- Autenticadas (layout com sidebar) ---
  { path: "/dashboard", name: "dashboard", component: DashboardView, meta: { requiresAuth: true, title: "Visão Geral" } },
  { path: "/produtores", name: "producers", component: ProducersView, meta: { requiresAuth: true, title: "Produtores" } },
  { path: "/produtores/:id", name: "producer-detail", component: ProducerDetailView, meta: { requiresAuth: true, title: "Detalhe do Produtor" } },
  { path: "/administracao", name: "admin", component: AdminView, meta: { requiresAuth: true, requiresAdmin: true, title: "Administração" } },

  // --- 404 ---
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView, meta: { public: true, layout: "blank" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Guard global: autenticacao + papel (role).
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: "dashboard" };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
