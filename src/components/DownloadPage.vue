<template>
  <div class="download">
    <CButton class="btn-success float-end" @click="router.push('upload')">New upload</CButton>
    <div v-if='otdWarning' class='mt-5'>
      <span style='color: red'>Warning, this file will self-destruct after being read</span>
    </div>
    <div v-if="context==='validating'" class='mt-5'>
      <div class='loader-wrapper'>
        <div class='loader'></div>
        <div class='loader-section section-left'></div>
        <div class='loader-section section-right'></div>
      </div>
    </div>

    <CCard class='mt-5' v-else-if="context==='password'">
      <CCardHeader>
        password
      </CCardHeader>
      <CCardBody>
        <CFormInput type="password" v-model='password' />
      </CCardBody>
      <CCardFooter>
        <CButton class="btn-primary" @click='validatePassword'>Validate and Download</CButton>
      </CCardFooter>
    </CCard>

    <CCard class="mt-5" v-else-if="context==='download'">
      <CCardHeader>Download</CCardHeader>
      <CCardBody>
        <h6>Expires in: {{ expiryDat }}</h6>
      </CCardBody>
      <CCardFooter>
        <CButton class="btn-primary" @click='downloadFile'>Download</CButton>
      </CCardFooter>
    </CCard>


    <CCard class='mt-5' v-else-if="context==='error'">
      <CCardHeader>
        <img src='https://cdn.discordapp.com/emojis/867743530754375682.webp?size=96&quality=lossless'>
      </CCardHeader>
      <CCardBody>
        <p>{{ contextText }}</p>
        <h1>{{expiryDat}}</h1>
      </CCardBody>
    </CCard>

    <div v-if="downloading" class="downloadNotification">
      <p>Download started...</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import '@coreui/coreui/dist/css/coreui.min.css'
import {onMounted, ref} from "vue";
import {CButton, CFormInput, CCardHeader, CCard, CCardBody, CCardFooter} from "@coreui/vue";
import {useRoute, useRouter} from "vue-router";
import axios from "axios";

const route = useRoute()
const router = useRouter();

const otdWarning = ref(false);
const contextText = ref('');

const password = ref('');
const expiryDat = ref('');

const context = ref('')
const file = ref()
const downloading = ref(false);

onMounted(() => {
  file.value = route.query.file;

  if (file.value !== '' && file.value !== undefined) {
    validateFile()
  } else {
    context.value = 'error'
    contextText.value = 'no file identifier provided'
  }
})

const downloadFile = () => {
  validatePassword()
};

const validatePassword = async () => {
  axios.post('/api/transfer/validate/' + file.value, {
    passwordHash: await hashWithSHA256(password.value)
  }).then(response => {
    downloading.value = true
    const url = response.data.url;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.value);

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
      downloading.value = false

      if (otdWarning.value) {
        router.go(0)
      }
    }, 4000)
  }).catch(err => {
    console.error(err);
    context.value = 'error';
    if (err.response && err.response.status === 404) {
      otdWarning.value = false;
      contextText.value = 'File not found';
    } else {
      contextText.value = err.message;
    }
  });
};

async function hashWithSHA256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await window.crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const filename = ref<string>('')

const validateFile = async () => {
  axios.get('/api/transfer/get/' + file.value).then(response => {
    const data = JSON.parse(JSON.stringify(response.data));

    if (data.options.otd) {
      otdWarning.value = true;
    }

    expiryDat.value = getRemainingTime(data.timeout * 1000)

    filename.value = data.filename;

    if (data.options.passwordEnabled) {
      context.value = 'password';
    } else {
      context.value = 'download';
    }
  }).catch(err => {
    context.value = 'error';
    if (err.response.status === 404) {
      otdWarning.value = false;
      contextText.value = 'File not found'
    } else {
      contextText.value = err.message;
    }
  })
}

const getRemainingTime = (endTime: number) => {
  const endDate = new Date(endTime)

  const _second = 1000;
  const _minute = _second * 60;
  const _hour = _minute * 60;
  const _day = _hour * 24;

  const now = new Date();

  const distance = endDate.getTime() - now.getTime();

  if (distance < 0) {
    return 'Expired'
  }

  const days = Math.floor(distance / _day);
  const hours = Math.floor((distance % _day) / _hour);
  const minutes = Math.floor((distance % _hour) / _minute);
  const seconds = Math.floor((distance % _minute) / _second);

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
}
</script>

<style scoped>
.download {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  background: #f8f9fa;
}

.downloadNotification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);
  background-color: white;
}
</style>