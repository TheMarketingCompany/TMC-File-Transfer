<template>
  <div class="grid dashboard" :class="loading ? 'blur' : ''">

    <div class="col-12 lg:col-12">
      <div class="card donut ">
        <h5>Upload file(s)</h5>

        <FileUpload
            @upload="onUpload"
            :multiple="false"
            :maxFileSize="99000000"
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

        <div v-if="uploadFinished" class="flex-row mt-5" @click="copyClipboard">
          <Button>Copy download link to clipboard</Button>
        </div>

      </div>
    </div>

  </div>

  <div v-if="loading">

      <div class="loader-wrapper">
        <div class="loader"></div>
        <ProgressBar :value="uploadProgress" class="custProg">
          {{uploadProgress}}%
        </ProgressBar>
        <div class="loader-section section-left"></div>
        <div class="loader-section section-right"></div>
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
      loading: false,
      s3: null,
      selectedFile: undefined,
      onetimeDownload: false,
      passwordEnabled: false,
      password: '',
      filename: '',
      uploadProgress: 0,
      uploadFinished: false,
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
    onUpload() {
      this.$toast.add({severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000});
    },
    filesSelected(event) {
      this.uploadFinished = false
      this.selectedFile = event.files[0]
    },
    copyClipboard() {
      navigator.clipboard.writeText('https://uploads.tmc.jetzt/#/dl?file=' + this.filename)
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
      this.loading = true
      axios.post('/api/transfer/create/' + this.selectedFile.name, {
        otd: this.onetimeDownload,
        lifetime: this.timeLimit,
        passwordEnabled: this.passwordEnabled,
        passwordHash: sha('sha256').update(this.password).digest('hex')
      }).then(res => {
        this.filename = res.data.fileId

        this.upload()
      }).catch(err => {
        console.log(err)
        this.loading = false
      })
    },

    upload() {
      const presignedUploadUrl = this.s3.getSignedUrl('putObject', {
        Bucket: 'transfer',
        Key: this.filename + '.' + this.selectedFile.name.split('.').pop(),
        Expires: 21600
      })

      axios.put('https://bucket.tmc.jetzt/' + presignedUploadUrl, this.selectedFile, {
        onUploadProgress: (event) => {
          this.uploadProgress = (event.loaded / (event.total/100))
          console.log(this.uploadProgress + '% loaded')
        }
      }).then(res => {
        this.loading = false
        this.uploadFinished = true
        console.log(res)
      }).catch(err => {
        console.log(err)
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
.loader-wrapper .loader-section {
  opacity: 0;
  width: 50%;
}

.blur {
  filter: blur(4px);
  position: absolute;
  width: 100%;
  height: 100%;
}

.custProg {
  display: block;
  margin-top: 35%;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}
</style>
