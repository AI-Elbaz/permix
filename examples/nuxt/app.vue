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
    </Check>
  </div>
</template>
