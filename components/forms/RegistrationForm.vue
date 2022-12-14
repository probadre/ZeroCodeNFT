<template>
	<b-form novalidate @submit.prevent="onSubmit">
		<b-form-group label="First Name" label-class="required">
			<b-form-input
				id="firstName"
				name="firstName"
				type="text"
				v-model="form.firstName"
				:state="validateState('form.firstName')">
			</b-form-input>
			<b-form-invalid-feedback :state="state.firstName">
				Please correct "First Name"
			</b-form-invalid-feedback>
		</b-form-group>
		<b-form-group label="Last Name" label-class="required">
			<b-form-input
				id="lastName"
				name="lastName"
				type="text"
				v-model="form.lastName"
				:state="validateState('form.lastName')">
			</b-form-input>
			<b-form-invalid-feedback :state="state.lastName">
				Please correct "Last Name"
			</b-form-invalid-feedback>
		</b-form-group>
		<b-form-group label="Email Address" label-class="required">
			<b-form-input
				id="email"
				name="email"
				type="email"
				v-model="form.email"
				:state="validateState('form.email')">
			</b-form-input>
			<b-form-invalid-feedback :state="state.email">
				Please correct "Email"
			</b-form-invalid-feedback>
		</b-form-group>
		<b-form-group label="Referral Code">
			<b-form-input
				id="referralCode"
				name="referralCode"
				debounce="500"
				type="text"
				v-model="form.referralCode"
				:state="validateState('form.referralCode')"
			></b-form-input>
			<b-form-invalid-feedback v-if="$v.form.referralCode.$anyError">
				Please correct "Referral Code"
			</b-form-invalid-feedback>
			<b-form-invalid-feedback v-if="!$v.form.referralCode.exists">
				Referral Code is invalid or doesn't exist
			</b-form-invalid-feedback>
		</b-form-group>
		<b-form-group label="Phone Number">
			<b-form-input
				id="phoneNumber"
				name="phoneNumber"
				type="tel"
				v-model="form.phoneNumber"
				></b-form-input>
			<!-- <b-form-invalid-feedback :state="state.phoneNumber">
				Please correct "Phone Number"
			</b-form-invalid-feedback> -->
		</b-form-group>
		<b-form-group label="Connected Wallet Address">
			<b-form-input
				id="publicKey"
				name="publicKey"
				type="text"
				disabled
				v-model="form.publicKey"
				></b-form-input>
		</b-form-group>
		<b-overlay :show="isBusy" rounded>
			<b-button type="submit" block variant="primary">Register</b-button>
		</b-overlay>
	</b-form>
</template>

<script>
import { mapActions } from 'vuex'
import { validateState } from '@/utils'
import { required, alpha, alphaNum, email } from 'vuelidate/lib/validators'

export default {
	data() {
		return {
			isBusy: false,
			form: {
				publicKey: this.$wallet.account,
				referralCode: this.$route.query['ref'],
				tags: ['website-lead'],
				leadSource: null
			},
		}
	},
	validations: {
		form: {
			email: { required, email },
			firstName: { required, alpha },
			lastName: { required, alpha },
			referralCode: {
				alphaNum,
				async exists(code) {
					if (!code) return true
					const { data: exists } = await this.$axios.get('/referrals/exists', {
						params: {
							code
						}
					})
					return exists
				}
			},
		},
	},
	computed: {
		state() {
			return {
				email: !this.$v.form.email.$anyError,
				firstName: !this.$v.form.firstName.$anyError,
				lastName: !this.$v.form.lastName.$anyError,
			}
		},
	},
	mounted() {
		this.form.leadSource = this.$route.query['utm_ads_source']
		console.info('lead source: ', this.form.leadSource)
	},
	watch: {
		'$wallet.account': function(newVal) {
			this.form.publicKey = newVal
		}
	},
	methods: {
		...mapActions(['signUp']),
		validateState,
		async onSubmit() {
			this.$v.$touch()
            if (this.$v.form.$invalid) {
				return
            }
			if (!this.$wallet.isConnected) {
				await this.$wallet.connect()
			}
			this.isBusy = true
			const success = await this.signUp(this.form)
			if(success) {
				this.$emit('done')
				this.$gtag('event', 'signup')
			}
			this.isBusy = false
		}
	}
}
</script>
