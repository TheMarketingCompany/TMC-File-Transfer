<template>
    <div class='grid'>
        <div class='col-12'>

            <Toolbar>

                <template #end>
                    <Button label='Upload' icon='pi pi-upload' class='p-button-success' @click='openUpload' />
                </template>
            </Toolbar>
            <div v-if='otdWarning' class='mt-5'>
                <span style='color: red'>Warning, this file will self-destruct after being read</span>
                <span style='color: red'>Warning, this file will self-destruct after being read</span>
            </div>
            <div v-if="context==='validating'" class='mt-5'>
                <div class='loader-wrapper'>
                    <div class='loader'></div>
                    <div class='loader-section section-left'></div>
                    <div class='loader-section section-right'></div>
                </div>
            </div>
            <div class='card mt-5' v-else-if="context==='password'">
                <h5>password</h5>
                <Password v-model='password' />
                <Button @click='validatePassword'>Validate</Button>
            </div>
            <div class='card mt-5' v-else-if="context==='download'">
                <h5>Download</h5>
                <h6>Expires in: {{ expiryDate }}</h6>
                <Button @click='downloadFile'>Download</Button>
            </div>
            <div class='card mt-5' v-else-if="context==='error'">
                <h5>
                    <img src='https://cdn.discordapp.com/emojis/867743530754375682.webp?size=96&quality=lossless'>
                </h5>
                <p>{{ contextText }}</p>

                <h1>{{expiryDate}}</h1>

            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

const sha = require('sha.js');

export default {
    mounted() {
        this.file = this.$route.query.file;

        if (this.file !== '' && this.file !== undefined) {
            this.validateFile(this.file);
        } else {
            this.context = 'error';
            this.contextText = 'No file identifier provided';
        }
    },
    data() {
        return {
            context: 'validating',
            otdWarning: false,
            contextText: '',
            password: '',
            downloadLink: '',
            expiryDate: '',
        };
    },
    methods: {
        getRemainingTime(endTime) {
            const endDate = new Date(endTime)

            const _second = 1000;
            const _minute = _second * 60;
            const _hour = _minute * 60;
            const _day = _hour * 24;

            const now = new Date();

            const distance = endDate - now;

            if (distance < 0) {
                return 'Expired'
            }

            const days = Math.floor(distance / _day);
            const hours = Math.floor((distance % _day) / _hour);
            const minutes = Math.floor((distance % _hour) / _minute);
            const seconds = Math.floor((distance % _minute) / _second);

            return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
        },
        downloadFile() {
            this.validatePassword();
        },
        validateFile(file) {
            axios.get('/api/transfer/get/' + file).then(res => {
                const data = JSON.parse(JSON.stringify(res.data));
                console.log(data);

                if (data.options.otd === true) {
                    this.otdWarning = true;
                }

                this.expiryDate = this.getRemainingTime(data.timeout * 1000)

                if (data.options.passwordEnabled === true) {

                    console.log('password enabled');
                    this.context = 'password';
                    console.log('this.context => ' + this.context);
                } else {
                    this.context = 'download';
                }
            }).catch(err => {
                this.context = 'error';
                if (err.response.status === 404) {
                    this.otdWarning = false;
                    this.contextText = 'File not found';
                } else {
                    this.contextText = err.message;
                }
            });
        },
        validatePassword() {
            var windowReference = window.open();
            axios.post('/api/transfer/validate/' + this.file, {
                passwordHash: sha('sha256').update(this.password).digest('hex'),
            }).then(res => {
                windowReference.location = res.data.url;
                //window.open(res.data.url, '_blank')
            }).catch(err => {
                console.log(err);
                this.context = 'error';
                if (err.response.status === 404) {
                    this.otdWarning = false;
                    this.contextText = 'File not found';
                } else {
                    this.contextText = err.message;
                }
            });
        },
        openUpload() {
            let r = this.$router.resolve({
                name: 'dashboard', // put your route information in
                params: this.$route.params, // put your route information in
                query: this.$route.query, // put your route information in
            });
            window.location.assign(r.href);
        },
    },
};
</script>

<style scoped>

</style>
