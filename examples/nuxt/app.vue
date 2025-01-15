<script setup lang="ts">
// some composable to get user role
function useUser() {
  return ref({
    role: 'admin' as const,
  })
}

const user = useUser()

watch(user, async () => {
  await setupPermix(user.value.role)
}, {
  immediate: true,
})
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
