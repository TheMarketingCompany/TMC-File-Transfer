<template>
  <div class="grid dashboard" :class="loading ? 'blur' : ''">

    <div class="col-12 lg:col-12">
      <div class="card donut ">
        <h5>Upload file(s)</h5>

        <FileUpload
            @upload="onUpload"
            :multiple="false"
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
      <div class="custProg1">
        Total progress
        <ProgressBar :value="chunkProgress">
          {{ Math.round(chunkProgress) }}%
        </ProgressBar>
      </div>
      <div class="custProg2">
        Chunk progress
        <ProgressBar :value="uploadProgress">
          {{ uploadProgress }}%
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
    onUpload() {
      this.$toast.add({severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000});
    },
    filesSelected(event) {
      this.uploadFinished = false
      this.selectedFile = event.files[0]
      this.splitFile()
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
        this.initiateMultipart()
        //this.upload()
      }).catch(err => {
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

        let multiplier = 100 / this.multipartChunks.length

        let currentChunkNum = 0

        for (const chunk of this.multipartChunks) {
          this.chunkProgress = currentChunkNum * multiplier
          console.log(this.chunkProgress)

          currentChunkNum += 1
          const index = this.multipartChunks.indexOf(chunk);
          try {
            let data = new FormData()
            data.append('UploadId', res.data.uploadId)
            data.append('PartNumber', (index + 1).toString())
            data.append('chunk', chunk.data)
            data.append('filename', this.filename)


            const response = await axios.put('https://bucket.tmc.jetzt/upload', data, {
              onUploadProgress: (chunkProgress) => {
                console.log(chunkProgress)
              }
            })
            console.log(response.data.ETag)
            console.log(response.data.PartNumber)

            multis.push({
              ETag: response.data.ETag,
              PartNumber: response.data.PartNumber
            })
          } catch (e) {
            multiError = true
            console.log(e)
          }
        }

        if (multiError === true) {
          // abort multipart upload
        } else {
          // finish multipart upload

          axios.post('https://bucket.tmc.jetzt/upload', {
            filename: this.filename,
            parts: multis,
            uploadId: this.multiId
          }).then(res => {
            console.log('success')
            console.log(res.data)
          }).catch(err => {
            console.log(err)
          })
        }
      }).catch(err => {
        console.log(err)
      })
    },


    splitFile() {
      let chunks = []
      var chunkSize = 95000000; // 95MB
      var fileSize = this.selectedFile.size;
      var chunkCount = Math.ceil(fileSize / chunkSize);
      var chunk = 0;

      console.log('file size..', fileSize);
      console.log('chunks...', chunkCount);

      while (chunk < chunkCount) {
        var offset = chunk * chunkSize;
        console.log('current chunk..', chunk);
        //console.log('offset...', chunk*chunkSize);
        //console.log('file blob from offset...', offset)
        //console.log(this.selectedFile.slice(offset,chunkSize));
        chunks.push({
          chunkNumber: chunk,
          data: this.selectedFile.slice(offset, offset + chunkSize)
        })
        chunk++;
      }

      console.log(chunks)
      this.multipartChunks = chunks
    },

    upload() {
      const presignedUploadUrl = this.s3.getSignedUrl('putObject', {
        Bucket: 'transfer',
        Key: this.filename + '.' + this.selectedFile.name.split('.').pop(),
        Expires: 21600
      })

      axios.put('https://bucket.tmc.jetzt/' + presignedUploadUrl, this.selectedFile, {
        onUploadProgress: (event) => {
          this.uploadProgress = (event.loaded / (event.total / 100))
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
