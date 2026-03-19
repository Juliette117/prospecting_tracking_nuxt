<script setup lang="ts">
const user = useSupabaseUser()

watchEffect(() => {
  navigateTo(user.value ? '/dashboard' : '/auth/login')
})
</script>
