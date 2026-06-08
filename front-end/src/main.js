import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router/index.js";
import { useAuthStore } from "./stores/auth.js";
import "./assets/styles/main.css";

// Bootstrap da aplicacao:
//  1. cria Pinia e Router;
//  2. inicializa a store de auth (tenta refresh silencioso via cookie httpOnly)
//     ANTES de montar, para que os guards de rota tenham o estado correto;
//  3. monta a app.

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const auth = useAuthStore();
auth
  .initialize()
  .catch(() => {
    /* falha no bootstrap de auth nao deve impedir a montagem */
  })
  .finally(() => {
    app.use(router);
    app.mount("#app");
  });
