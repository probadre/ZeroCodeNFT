<template>
	<b-container fluid>
		<b-row class="mb-2">
			<b-col sm="12" md="8">
				<h4 class="m-0">Whitelist</h4>
				<b-link href="/whitelist-csv-example.csv" download
					>Download example</b-link
				>
			</b-col>
			<b-col sm="12" md="4">
				<b-row class="my-2">
					<b-col cols="6">
						<b-button
							block
							:variant="commitBtnVariant"
							:disabled="isProcessingWhitelistCommit || invalidAddresses.length > 0"
							@click="onWhitelistCommit"
							>
								Commit <b-icon icon="cloud-arrow-up"></b-icon>
							</b-button
						>
					</b-col>
					<b-col cols="6">
						<b-button
							block
							variant="danger"
							:disabled="isProcessingWhitelistCommit || whitelist.length === 0"
							@click="onClearWhitelist"
							>Clear</b-button
						>
					</b-col>
				</b-row>
			</b-col>
		</b-row>
		<b-row>
			<b-col sm="12" md="8">
				<b-form-group label="Enter addresses manually or upload a file. Whitelist has to be committed to take effect.">
					<b-form-tags
						v-model="whitelist"
						invalid-tag-text="Address is invalid"
						:tag-validator="validateAddress"
						placeholder="Enter Wallet Address">
					</b-form-tags>
				</b-form-group>
			</b-col>
			<b-col sm="12" md="4" class="mb-3">
				<b-row no-gutters>
					<b-col>
					<b-form-group label="Upload a file">
						<b-form-file
							accept=".csv"
							@input="onImportCsv"
							placeholder="Choose or drop .csv file"
							drop-placeholder="Drop file here...">
						</b-form-file>
					</b-form-group>
						<div v-if="invalidAddresses.length > 0">
							<h5 class="text-danger">Fix invalid addresses</h5>
							<ul class="p-0">
								<li
									class="d-flex"
									v-for="(addr, idx) in invalidAddresses"
									:key="idx">
									{{ addr }}
									<b-icon
										class="my-auto pointer"
										icon="trash"
										variant="danger"
										@click="onRemoveInvalidAddress(addr)"></b-icon>
								</li>
							</ul>
						</div>
					</b-col>
				</b-row>
			</b-col>
		</b-row>
	</b-container>
</template>

<script>
import { ethers } from 'ethers'
import { getMerkleRoot } from '@/utils'
import { mapState, mapGetters, mapMutations } from 'vuex'
import { getExplorerUrl } from '@/constants/metamask'
import alertMixin from "@/mixins/alertMixin";

export default {
	props: {
		smartContractId: String,
	},
	mixins:[alertMixin],
	data() {
		return {
			smartContract: null,
			whitelist: [],
			isProcessingWhitelistCommit: false,
			commitBtnVariant: 'primary',
		}
	},
	async created() {
		const { data } = await this.$axios.get(
			`/users/${this.userId}/smartcontracts/${this.smartContractId}`
		)
		this.smartContract = data
		this.whitelist = this.smartContract.whitelist.filter(
			(a) => a !== ethers.utils.AddressZero
		)
	},
	computed: {
		...mapState(['isBusy']),
		...mapGetters(['userId']),
		invalidAddresses() {
			return this.whitelist.filter(a => !this.validateAddress(a))
		}
	},
	methods: {
		...mapMutations(['setBusy']),
		validateAddress(value) {
			return ethers.utils.isAddress(value)
		},
		onRemoveInvalidAddress(a) {
			const idx = this.whitelist.indexOf(a)
			this.whitelist.splice(idx,1)
		},
		async onWhitelistCommit() {
			try {
				if (this.invalidAddresses.length > 0) {
					this.$bvToast.toast(
						'Whitelist contains invalid addresses. Please remove and resubmit',
						{
							title: 'Whitelist',
							variant: 'danger',
						}
					)
					return
				}

				this.setBusy({ isBusy: true })

				const wlToCommit = this.whitelist.length === 0
					? [ethers.constants.AddressZero]
					: this.whitelist

				const merkleRoot = getMerkleRoot(wlToCommit)

				const { address, abi, chainId } = this.smartContract
				const contract = new ethers.Contract(
					address,
					abi,
					this.$wallet.provider.getSigner()
				)

				await this.$wallet.switchNetwork(chainId)

				const gasPrice = await this.$wallet.provider.getGasPrice()

				const txResponse = await contract.setMerkleRoot(merkleRoot, {
					gasPrice
				})
				this.isProcessingWhitelistCommit = true

				await this.$axios.patch(
					`/smartcontracts/${this.smartContract.id}/whitelist`,
					{
						whitelist: this.whitelist,
						merkleRoot: `0x${merkleRoot.toString('hex')}`
					}
				)

				const msg = [this.createToastMessage(txResponse.hash)]
				
				this.$bvToast.toast(msg, {
					title: `Processing 'Commit List'`,
					variant: 'success',
				})
				this.commitBtnVariant = 'primary'
				this.removeAlert('whitelistMustCommit')

				txResponse.wait().then(async (_) => {
					this.isProcessingWhitelistCommit = false
					this.$bvToast.toast(msg, {
						title: 'Commit List',
						variant: 'success',
					})
				})
			} catch (err) {
				console.log({ err })
				this.$bvToast.toast('Whitelist commit failed', {
					title: 'Whitelist',
					variant: 'danger',
				})
			} finally {
				this.isProcessingWhitelistCommit = false
				this.setBusy({ isBusy: false })
			}
		},
		async onClearWhitelist() {
			this.whitelist = []
			this.commitBtnVariant = 'warning'
		},
		async onImportCsv(file) {
			if (file === null) return

			this.setBusy({ isBusy: true })

			try {
				const form = new FormData()
				form.append('file', file)

				const { data } = await this.$axios.post(
					`/smartcontracts/${this.smartContract.id}/whitelist`,
					form
				)

				this.whitelist = data

				this.commitBtnVariant = 'warning'

				this.addAlert({
					id: 'whitelistMustCommit',
					text: 'You MUST commit the list to save it into the smart contract for it to take effect!',
				})

				this.$bvToast.toast('File successfully uploaded', {
					title: 'Whitelist',
					variant: 'success',
				})
			} catch (err) {
				console.log({ err })
				this.$bvToast.toast('File upload failed. Please make sure format matches the example with no trailing commas in .csv', {
					title: 'Whitelist',
					variant: 'danger',
				})
			} finally {
				this.setBusy({ isBusy: false})
			}
		},
		createToastMessage(hash) {
			const h = this.$createElement
			return h('span', [
				'Transaction accepted! ',
				h(
					'b-link',
					{
						props: {
							target: '_blank',
							href: `${getExplorerUrl(this.smartContract.chainId)}/tx/${hash}`,
						},
					},
					['View on block explorer >']
				),
			])
		},
	},
}
</script>
