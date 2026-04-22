<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import MainLayout from '@/layouts/MainLayout.vue'
import { onMounted } from 'vue'

const route = useRoute()
const auth = useAuthStore()
const configStore = useConfigStore()

onMounted(() => {
  configStore.init()
})

const isBlankLayout = computed(() => route.meta.layout === 'blank' || !auth.isAuthenticated)
</script>

<template>
  <MainLayout v-if="!isBlankLayout">
    <router-view />
  </MainLayout>
  <router-view v-else />
</template>
