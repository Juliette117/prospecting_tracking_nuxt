<template>
  <UApp :toaster="{ progress: false }">
    <div class="app-ambient-shell">
      <div class="app-ambient" aria-hidden="true">
        <div class="app-ambient-orb app-ambient-orb-blue" />
        <div class="app-ambient-orb app-ambient-orb-cyan" />
      </div>

      <div class="app-page-layer">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </div>
    </div>
  </UApp>
</template>

<style>
.app-ambient-shell {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

.app-ambient {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 2;
  -webkit-mask-image: radial-gradient(circle at center, transparent 22%, rgba(0, 0, 0, 0.14) 40%, rgba(0, 0, 0, 0.82) 64%);
  mask-image: radial-gradient(circle at center, transparent 22%, rgba(0, 0, 0, 0.14) 40%, rgba(0, 0, 0, 0.82) 64%);
}

.app-page-layer {
  position: relative;
  z-index: 1;
}

.app-ambient-orb {
  position: absolute;
  border-radius: 9999px;
  opacity: 0.58;
  filter: blur(20px);
  mix-blend-mode: screen;
  will-change: transform;
  animation: app-orb-drift 20s ease-in-out infinite alternate;
}

.app-ambient-orb-blue {
  top: 16px;
  right: -260px;
  width: 620px;
  height: 620px;
  background:
    radial-gradient(circle at 28% 28%, rgba(125, 211, 252, 0.54), transparent 54%),
    radial-gradient(circle at 62% 62%, rgba(79, 124, 255, 0.48), transparent 72%);
}

.app-ambient-orb-cyan {
  bottom: 16px;
  left: -250px;
  width: 560px;
  height: 560px;
  background:
    radial-gradient(circle at 42% 42%, rgba(52, 211, 153, 0.3), transparent 55%),
    radial-gradient(circle at 58% 58%, rgba(56, 189, 248, 0.36), transparent 72%);
  animation-duration: 24s;
  animation-delay: -7s;
}

@keyframes app-orb-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-18px, 18px, 0) scale(1.03);
  }

  100% {
    transform: translate3d(20px, -14px, 0) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-ambient-orb {
    animation: none;
  }
}
</style>
