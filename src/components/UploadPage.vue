<template>
  <div>
    <div class="upload-form">
      <CForm>
        <div :class="{'blur-2xl': uploading}">
          <CFormInput class="mb-2" type="file" @change="fileChangedHandler"/>

          <CFormCheck
              label="Enable password protection"
              v-model="passwordEnabled"
              switch
          />
          <CFormInput class="mb-2" v-if="passwordEnabled" v-model="password" type="password" aria-placeholder="password"
                      placeholder="password"/>

          <CFormCheck
              label="Onetime download"
              v-model="onetimeDownload"
          />


          <div class="mb-2">
            <CFormSelect
                :options="[
                  {
                    label: '1 day',
                    value: '1'
                  },
                  {
                    label: '1 week',
                    value: '7'
                  },
                  {
                    label: '1 month (30 days)',
                    value: '30'
                  }
              ]"
                v-model="timelimit"
            />
          </div>
          <CButton color="primary" @click="upload()">Upload</CButton>
        </div>

        <div v-if="uploading" class="w-full max-w-lg p-4 mt-5 bg-white rounded shadow-xl">
          <div class="relative pt-1">
            <div class="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
              <div :style="{width: `${uploadProgress}%`}"
                   class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded-r"></div>
            </div>
          </div>
          <p class="text-center pt-3">{{ uploadProgress }}%</p>
        </div>
      </CForm>


      <CModal :visible="showDownloadModal" @close="showDownloadModal = false">
        <CModalHeader>
          Uploaded file successfully
        </CModalHeader>
        <CModalBody>
          <span> Download url:
            {{ downloadLink }}
          </span>
        </CModalBody>
        <CModalFooter>

          <CButton class="btn btn-primary"
                   @click="copyToClipboard"
                   v-if="downloadLink">
            Copy to clipboard
          </CButton>
        </CModalFooter>
      </CModal>


    </div>
  </div>
</template>

<script setup lang="ts">
import '@coreui/coreui/dist/css/coreui.min.css'
import axios from 'axios'

import {onBeforeMount, ref} from 'vue';
import {S3Client} from "@aws-sdk/client-s3";
import {Upload} from "@aws-sdk/lib-storage";

import useClipboard from 'vue-clipboard3'

const {toClipboard} = useClipboard()

const showDownloadModal = ref(false);

const copyToClipboard = () => {
  toClipboard(downloadLink.value)
}

import {CFormInput, CFormCheck, CButton, CForm, CFormSelect, CModal, CModalHeader, CModalBody, CModalFooter} from "@coreui/vue";

const timelimit = ref('1');
const passwordEnabled = ref(false);
const onetimeDownload = ref(false);
const fileId = ref('')

const downloadLink = ref('https://google.com');

// @ts-ignore
let s3;


async function hashWithSHA256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await window.crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}


const uploadProgress = ref(0);
const password = ref('');
const uploading = ref(false);

const selectedFile = ref<File>();

const bucket = ref<string>('')

onBeforeMount(() => {
  axios.get('/api/transfer/auth').then(response => {
    const auth = response.data

    bucket.value = auth.bucket;

    s3 = new S3Client({
      region: "auto",
      credentials: {
        accessKeyId: auth.accessKeyId,
        secretAccessKey: auth.secretAccessKey,
      },
      endpoint: auth.endpoint
    });

  })


})

const upload = async () => {
  if (!selectedFile.value) {
    return;
  }
  const file: File = selectedFile.value;

  await axios.post('/api/transfer/' + file.name, {
    otd: onetimeDownload.value,
    lifetime: timelimit.value,
    passwordEnabled: passwordEnabled.value,
    passwordHash: await hashWithSHA256(password.value)
  }).then(response => fileId.value = response.data.fileId).catch(err => {
    console.error(err)
    return;
  })

  const params = {
    Bucket: bucket.value,
    Key: fileId.value,
    ContentType: file.type,
    ContentDisposition: 'attachment; filename=' + file.name,
    Body: file,
  };

  const upload = new Upload({
    // @ts-ignore
    client: s3,
    params: params
  })

  upload.on('httpUploadProgress', (progress) => {
    console.info(`Uploaded ${progress.loaded} out of ${progress.total} bytes`);
    // @ts-ignore
    uploadProgress.value = Math.round((progress.loaded / progress.total) * 100);
  });

  uploading.value = true;

  try {
    await upload.done();
    downloadLink.value = window.location.origin + '/?file=' + fileId.value;
    showDownloadModal.value = true;
    uploading.value = false
  } catch (error) {
    console.error("Upload failed", error);
    uploading.value = false

  }
}

const fileChangedHandler = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length === 0) {
    return;
  }

  selectedFile.value = files[0];
};

</script>

<style scoped>
.upload-form {
  max-width: 400px; /* Adjust the width as needed */
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc; /* Light grey border */
  border-radius: 0.25rem; /* Rounded corners */
  background: #f8f9fa; /* Light background */
}

.upload-form .c-form-check {
  margin-top: 1rem;
}

.upload-form .c-button {
  margin-top: 1rem;
  display: block; /* Make the button expand to the full width */
  width: 100%;
}

/* Style for the file input field */
.upload-form .c-form-input[type="file"] {
  margin-bottom: 1rem;
}

/* Adjust radio buttons spacing */
.upload-form .c-form-check[type="radio"] {
  margin-right: 1rem; /* Space out the radio buttons */
}
</style>


