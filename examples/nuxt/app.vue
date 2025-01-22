<script setup lang="ts">
import { Check, setupPermix } from './utils/permix'

setupPermix()

const { check } = usePermissions()
</script>

<template>
  <div>
    Can I create a post? {{ check('post', 'create') }}
    <hr>
    <Check entity="post" action="create">
      Can I create a post inside the Check component?
      <template #else>
        You don't have permission to create a post
      </template>
    </Check>
  </div>
</template>
