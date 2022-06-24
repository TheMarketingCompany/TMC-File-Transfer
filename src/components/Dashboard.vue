<template>
  <div class="grid dashboard">

    <div class="col-12 lg:col-12">
      <div class="card donut ">
        <h5>Upload file(s)</h5>

        <FileUpload
            @upload="onUpload"
            :multiple="false"
            accept="image/*"
            @select="filesSelected"
            :showUploadButton="false"
            :showCancelButton="false"
        />


        <div class="flex-row mt-5">
          <label>Onetime download</label>
          <Checkbox class="ml-2" v-model="onetimeDownload" :binary="true"/>
        </div>

        <div class="flex-row mt-5">
          <label>Enable password protection</label>
          <InputSwitch v-model="passwordEnabled"/>
          <p>
            <Password v-if="passwordEnabled" v-model="password"/>
          </p>
        </div>

        <div class="flex-row mt-5">
          <SelectButton v-model="timeLimit" :options="timeOptions"/>
        </div>

        <div class="flex-row mt-5">
          <Button @click="preUpload">Upload</Button>
        </div>

      </div>
    </div>

  </div>
</template>

<script>

import axios from "axios";
const sha = require('sha.js')
const S3 = require('aws-sdk/clients/s3')

export default {
  data() {
    return {
      s3: null,
      selectedFile: undefined,
      onetimeDownload: false,
      passwordEnabled: false,
      password: '',
      timeLimit: '1 week',
      timeOptions: [
        '1 day',
        '1 week',
        '1 month'
      ]
    }
  },
  components: {},
  mounted() {
    this.getAccessKeys()
  },
  methods: {
    menuToggle(event) {
      this.$refs.menu.toggle(event);
    },
    onUpload() {
      this.$toast.add({severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000});
    },
    filesSelected(event) {
      this.selectedFile = event.files[0]
    },
    getAccessKeys() {
      axios.get('/api/auth').then(res => {
        this.s3 = new S3({
          endpoint: 'https://' + res.data.endpoint + '.r2.cloudflarestorage.com',
          accessKeyId: res.data.accessKeyId,
          secretAccessKey: res.data.secretAccessKey,
          s3ForcePathStyle: true,
          signatureVersion: 'v4'
        })
      })
    },

    preUpload() {
      axios.post('/api/transfer/create/' + this.selectedFile.name, {
        otd: this.onetimeDownload,
        lifetime: this.timeLimit,
        passwordEnabled: this.passwordEnabled,
        passwordHash: sha('sha256').update(this.password).digest('hex')
      })
    },

    upload() {
      const presignedUploadUrl = this.s3.getSignedUrl('putObject', {
        Bucket: 'transfer',
        Key: this.selectedFile.name,
        Expires: 21600
      })

      axios.put('https://bucket.tmc.jetzt/' + presignedUploadUrl, this.selectedFile, {
        onUploadProgress: (event) => {
          console.log((event.loaded / (event.total/100)) + '% loaded')
        }
      }).then(res => {
        console.log(res)
      }).catch(err => {
        console.log(err)
      })
    }
  }
}
</script>

<style scoped>

</style>
