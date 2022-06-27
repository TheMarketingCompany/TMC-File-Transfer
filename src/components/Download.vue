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
      password: '',
      downloadLink: ''
    }
  },
  methods: {
    downloadFile() {
      window.open(this.downloadLink, '_blank')
    },
    validateFile(file) {
      axios.get('/api/transfer/get/' + file).then(res => {
        const data = JSON.parse(JSON.stringify(res.data))
        console.log(data)

        if (data.options.passwordEnabled === true) {
          console.log('password enabled')
          this.context = 'password'
          console.log('this.context => ' + this.context)
        } else {
          this.validatePassword()
        }
      }).catch(err => {
        console.log(err.response)
        this.context = 'error'
        if (err.response.status === 404) {

          this.contextText = 'File not found'
        } else {
          this.contextText = err.message
        }
      })
    },
    validatePassword() {
      axios.post('/api/transfer/validate/' + this.file, {
        passwordHash: sha('sha256').update(this.password).digest('hex')
      }).then(res => {
        window.open(res.data.url, '_blank')
      }).catch(err => {
        console.log(err)
      })
    }
  }
}
</script>

<style scoped>

</style>
