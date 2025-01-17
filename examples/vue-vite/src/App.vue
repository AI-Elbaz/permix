<script setup lang="ts">
import { watch } from 'vue'
import { usePermissions } from './composables/permissions'
import { usePosts } from './composables/posts'
import { useUser } from './composables/user'
import { setupPermix } from './lib/permix'

const user = useUser()
const { check, isReady } = usePermissions()
const posts = usePosts()

watch(user, async (user) => {
  if (user) {
    await setupPermix(user)
  }
})
</script>

<template>
  <div>
    Is Permix ready?
    {{ isReady ? 'Yes' : 'No' }}
    <hr>
    My user is
    {{ user?.id ?? '...' }}
    <hr>
    <div v-for="post in posts" :key="post.id">
      Can I edit the post where authorId is
      {{ post.authorId }}?
      {{ check('post', 'edit', post) ? 'Yes' : 'No' }}
    </div>
  </div>
</template>

<style scoped>
</style>
