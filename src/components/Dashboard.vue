<template>
  <div class="grid dashboard" :class="loading ? 'blur' : ''">

    <Toast/>
    <div class="col-12 lg:col-12">
      <div class="card donut ">
        <h5>Select file</h5>

        <FileUpload
            :multiple="false"
            @select="filesSelected"
            :showUploadButton="false"
            :showCancelButton="true"
            :file-limit="1"
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

        <div v-if="uploadFinished" >
          <div class="flex-row mt-5" @click="copyClipboard">
            <Button>Copy download link to clipboard</Button>
          </div>
          <div class="flex-row mt-5">
            <span>{{ window.location.origin + '/dl?file=' + this.filename }}</span>
          </div>
        </div>

      </div>
    </div>

  </div>

  <div v-if="loading">

    <div class="loader-wrapper">
      <div class="loader"></div>
      <div class="custProg1">
        Total progress
        <ProgressBar :value="totalProgress">
          {{ Math.round(totalProgress) }}%
        </ProgressBar>
      </div>
      <div class="custProg2">
        Chunk progress
        <ProgressBar :value="uploadProgress">
          {{ Math.round(uploadProgress) }}%
        </ProgressBar>
      </div>
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
      chunkProgress: 0,
      uploadProgress: 0,
      uploadFinished: false,
      timeLimit: '1 week',
      timeOptions: [
        '1 day',
        '1 week',
        '1 month'
      ],
      multipartChunks: [],
      presignedUrls: [],
      multiId: ''
    }
  },
  components: {},
  mounted() {
    this.getAccessKeys()
  },
  methods: {
    filesSelected(event) {
      this.uploadFinished = false
      this.selectedFile = event.files[0]
      this.splitFile()
    },
    copyClipboard() {
      try {
        navigator.clipboard.writeText(window.location.origin + '/dl?file=' + this.filename)
        this.$toast.add({severity: 'success', summary: 'Success', detail: 'Link copied to clipboard successfully', life: 3000});
      } catch (e) {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed copying link to clipboard', life: 3000});
        console.log(e)
      }
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
      }).catch(err => {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed initializing upload tool', life: 30000});
        this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 30000});
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
        this.initiateMultipart()
        //this.upload()
      }).catch(err => {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed initializing upload', life: 30000});
        this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 30000});
        console.log(err)
        this.loading = false
      })
    },

    initiateMultipart() {
      axios.post('/api/transfer/create/multipart/' + this.filename).then(async res => {

        console.log(res.data.uploadId)

        this.multiId = res.data.uploadId

        let multiError = false
        const multis = []

        for (const chunk of this.multipartChunks) {

          const index = this.multipartChunks.indexOf(chunk);
          try {
            let data = new FormData()
            data.append('UploadId', res.data.uploadId)
            data.append('PartNumber', (index + 1).toString())
            data.append('chunk', chunk.data)
            data.append('filename', this.filename)


            const response = await axios.put('https://bucket.tmc.jetzt/upload', data, {
              onUploadProgress: (chunkProgress) => {
                chunk.uploadProgress = (100 / chunkProgress.total) * chunkProgress.loaded
                this.uploadProgress = (100 / chunkProgress.total) * chunkProgress.loaded
              }
            })

            multis.push({
              ETag: response.data.ETag,
              PartNumber: response.data.PartNumber
            })
          } catch (e) {
            this.$toast.add({severity: 'error', summary: 'Error', detail: 'Error occured', life: 30000});
            this.$toast.add({severity: 'error', summary: 'Error', detail: e, life: 30000});
            multiError = true
            console.log(e)
          }
        }

        if (multiError === true) {
          axios.delete('https://bucket.tmc.jetzt/upload', {
            data: {
              UploadId: this.multiId,
              filename: this.filename
            }
          }).then(res => {
            console.log(res)
          }).catch(err => {
            this.$toast.add({severity: 'error', summary: 'Error', detail: 'Error occured', life: 30000});
            this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 30000});
            console.log(err)
          })
        } else {
          axios.post('https://bucket.tmc.jetzt/upload', {
            filename: this.filename,
            parts: multis,
            uploadId: this.multiId
          }).then(() => {
            this.chunkProgress = 0
            this.uploadProgress = 0
            this.loading = false
            this.uploadFinished = true

            this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Uploaded', life: 3000});
          }).catch(err => {
            this.$toast.add({severity: 'error', summary: 'Error', detail: 'Error occured', life: 30000});
            this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 30000});
            console.log(err)
          })
        }
      }).catch(err => {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'Error occured', life: 30000});
        this.$toast.add({severity: 'error', summary: 'Error', detail: err, life: 30000});
        console.log(err)
      })
    },


    splitFile() {
      let chunks = []
      var chunkSize = 95000000; // 95MB
      var fileSize = this.selectedFile.size;
      var chunkCount = Math.ceil(fileSize / chunkSize);
      var chunk = 0;

      while (chunk < chunkCount) {
        var offset = chunk * chunkSize;
        chunks.push({
          chunkNumber: chunk,
          data: this.selectedFile.slice(offset, offset + chunkSize),
          uploadProgress: 0
        })
        chunk++;
      }

      this.multipartChunks = chunks
    },

  },
  computed: {
    totalProgress() {
      let temp = 0
      this.multipartChunks.forEach(chunk => {
        temp += chunk.uploadProgress
      })

      temp = temp / this.multipartChunks.length
      return temp
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

.custProg1 {
  display: block;
  margin-top: 35%;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}

.custProg2 {
  display: block;
  margin-top: 2%;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}
</style>
