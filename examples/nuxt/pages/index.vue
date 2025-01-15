<script setup lang="ts">
const { check } = usePermissions()
</script>

<template>
  <div>
    Can I delete a user? {{ check('user', 'delete') }}
  </div>
</template>
