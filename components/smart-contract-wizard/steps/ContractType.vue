<template>
	<b-container fluid class="px-0 px-md-5">
		<b-row>
			<b-col>
				<h1 class="text-center mb-3">Pick Contract Type</h1>
			</b-col>
		</b-row>
		<b-row class="mb-5">
			<b-col
				sm="12"
				md="4"
				v-for="(type, idx) in types"
				:key="idx"
				@click="onCardSelected(type)"
				@mouseover="hoverCard(type.id)"
				@mouseout="hoverCard(null)">
				<ContractTypeCard
					class="mb-4"
					v-bind="type"
					@selected="onCardSelected(type)"
					:class="[
						{
							shadow:
								type.isAvailable &&
								(hovered === type.id ||
									smartContractBuilder.contractType === type.id),
						},
					]" />
			</b-col>
		</b-row>
	</b-container>
</template>

<script>
import smartContractBuilderMixin from '@/mixins/smartContractBuilder'
import { CONTRACT_TYPE } from '@/constants'
import { required } from 'vuelidate/lib/validators'
import ContractTypeCard from '@/components/smart-contract-wizard/ContractTypeCard.vue'
const contractTypes = [
	{
		id: CONTRACT_TYPE.ERC721,
		title: 'NFT | ERC721',
		description:
			'Typical NFT contract, suitable for most scenarios. Pick if unsure.',
		isAvailable: true,
	},
	{
		id: CONTRACT_TYPE.ERC721A,
		title: 'NFT | ERC721A (Azuki)',
		description: `
			Known as <a href="https://www.azuki.com/erc721a" target="blank">Azuki smart contract</a>, 
			suitable when you expect your customers to mint NFTs in small batches thus saving them on gas fees.
			Under certain circumstances this might increase the transfer gas fee (e.g. when sending NFTs to someone after mint).
			<a href="https://www.youtube.com/watch?v=ZnHNXne-P60" target="blank">More info</a>`,
		isAvailable: true,
	},
	{
		id: CONTRACT_TYPE.ERC721,
		title: 'NFT | ERC721 OmniChain (Custom order)',
		description: 'Spread out your NFT collection across 7 different blockchains. Allows NFTs to be transferred between these chains.',
		isAvailable: false,
	},
	{
		id: CONTRACT_TYPE.ERC20,
		title: 'Fungible | ERC20 (Custom order)',
		description: 'Typical fungible token contract.',
		isAvailable: false,
	},
	{
		id: CONTRACT_TYPE.MintPass,
		title: 'NFT | Membership/Mint Pass (Custom order)',
		description: 'Create NFT passes to use as memebership cards, event tickets, etc.',
		isAvailable: false,
	},
	{
		id: CONTRACT_TYPE.DAO,
		title: 'NFT | DAO (Custom order)',
		description: 'Decentralized Autonomous Organization with NFTs used for voting power.',
		isAvailable: false,
	},
]

export default {
	mixins: [smartContractBuilderMixin],
	components: {
		ContractTypeCard,
	},
	data() {
		return {
			hovered: null,
		}
	},
	validations: {
		smartContractBuilder: {
			contractType: { required },
		},
	},
	computed: {
		types() {
			return this.smartContractBuilder.id ||
				this.smartContractBuilder.clonedFrom // means it's a clone
				? contractTypes.filter(
						(t) => t.id === this.smartContractBuilder.contractType
				  )
				: contractTypes
		},
	},
	methods: {
		hoverCard(value) {
			this.hovered = value
		},
		onCardSelected(type) {
			if (!type.isAvailable) return

			this.updateSmartContractBuilder({
				contractType: type.id,
			})
			this.goNext()
		},
	},
}
</script>
