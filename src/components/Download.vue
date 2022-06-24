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
        <Password v-model="password"/>
        <Button @click="validatePassword">Validate</Button>
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
const sha = require('sha.js')

export default {
  mounted() {
    this.file = this.$route.query.file

    if (this.file !== '' && this.file !== undefined) {
      this.validateFile(this.file)
    } else {
      this.context = 'error'
      this.contextText = 'No file identifier provided'
    }
  },
  data() {
    return {
      context: 'validating',
      contextText: '',
      password: ''
    }
  },
  methods: {
    validateFile(file) {
      axios.get('/api/transfer/get/' + file).then(res => {
        const data = JSON.parse(res.data)

        if (data.passwordEnabled === true) {
          this.context = 'password'
        } else {
          this.validatePassword()
          this.context = 'download'
        }
      }).catch(err => {
        console.log(err)
        this.context = 'error'
        this.contextText = err.message
      })
    },
    validatePassword() {
      axios.post('/api/transfer/validate/' + this.file, {
        passwordHash: sha('sha256').update(this.password).digest('hex')
      }).then(res => {
        console.log(res.data)
      }).catch(err => {
        console.log(err)
      })
    }
  }
}
</script>

<style scoped>

</style>
