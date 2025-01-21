<script setup lang="ts">
import { setupPermix } from './utils/permix'

setupPermix()

const { check } = usePermissions()
</script>

<template>
  <div>
    Can I create a post? {{ check('post', 'create') }}
  </div>
</template>
