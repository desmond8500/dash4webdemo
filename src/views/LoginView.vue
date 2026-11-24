<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, isTechnician } from '@dash4/shared'
import { login, logout, session } from '@/services/session'
import { blip } from '@/utils/sound'

/** Écran de connexion « Appuyez sur Start » : compte Dash4 (de préférence le compte « Lecture seule »). */
const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function submit(): Promise<void> {
  error.value = null
  busy.value = true
  try {
    await login(email.value.trim(), password.value)
    // Comme dash4-web : réservé aux comptes gestionnaires, les techniciens utilisent l'application mobile
    if (isTechnician(session.user)) {
      await logout()
      blip('error')
      error.value = "Ce QG est réservé aux comptes gestionnaires. Utilisez l'application mobile Dash4."
      return
    }
    blip('open')
    void router.replace(typeof route.query.retour === 'string' ? route.query.retour : { name: 'hq' })
  } catch (e) {
    blip('error')
    error.value = e instanceof ApiError && e.status !== 0 ? e.message : "Impossible de joindre le serveur Dash4. Vérifiez la connexion."
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="login">
    <form class="panel card appear" aria-labelledby="login-title" @submit.prevent="submit">
      <div class="logo" aria-hidden="true">◆</div>
      <h1 id="login-title" class="display">Dash4 <span>QG</span></h1>
      <p class="muted">Connectez-vous avec votre compte Dash4</p>
      <label for="email">E-mail</label>
      <input id="email" v-model="email" class="input" type="email" autocomplete="username" required />
      <label for="password">Mot de passe</label>
      <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn primary start display" type="submit" :disabled="busy">{{ busy ? 'Connexion…' : 'Start ▶' }}</button>
    </form>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.card {
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 2rem;
  text-align: left;
}
.logo {
  font-size: 3rem;
  text-align: center;
  color: var(--cyan);
  text-shadow: 0 0 24px var(--cyan);
  animation: float calc(3s * var(--speed)) ease-in-out infinite;
}
@keyframes float {
  50% {
    transform: translateY(-6px);
  }
}
h1 {
  text-align: center;
  font-size: 2rem;
}
h1 span {
  color: var(--violet);
}
p.muted {
  text-align: center;
  margin: 0 0 1rem;
}
label {
  font-weight: 700;
  font-size: 0.9rem;
}
.error {
  color: var(--red);
  font-weight: 700;
}
.start {
  margin-top: 1rem;
  min-height: 52px;
  font-size: 1.1rem;
}
</style>
