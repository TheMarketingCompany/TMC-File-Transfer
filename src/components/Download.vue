<template>
  <div class="grid">
    <div class="col-12">
      <div v-if="context==='validating'">
        <div class="loader-wrapper">
          <div class="loader"></div>
          <div class="loader-section section-left"></div>
          <div class="loader-section section-right"></div>
        </div>
      </div>
      <div class="card" v-else-if="context==='password'">
        <h5>password</h5>

      </div>
      <div class="card" v-else-if="context==='download'">
        <h5>Download</h5>

      </div>
      <div class="card" v-else-if="context==='error'">
        <h5>
          <img src="https://cdn.discordapp.com/emojis/867743530754375682.webp?size=96&quality=lossless">
        </h5>
        <p>{{contextText}}</p>

      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  mounted() {
    console.log(this.$route.query.file)
    if (this.$route.query.file !== '' && this.$route.query.file !== undefined) {
      this.validateFile(this.$route.query.file)
    } else {
      this.context = 'error'
      this.contextText = 'No file identifier provided'
    }
  },
  data() {
    return {
      context: 'validating',
      contextText: ''
    }
  },
  methods: {
    validateFile(file) {
      axios.get('/api/transfer/get/' + file).then(res => {
        console.log(res.data)
        if (res.data.passwordEnabled === true) {
          this.context = 'password'
        } else {
          this.context = 'download'
        }
      }).catch(err => {
        console.log(err)
        this.context = 'error'
        this.contextText = err.message
      })
    }
  }
}
</script>

<style scoped>

</style>
