import { mapMutations } from "vuex"
export default {
  methods: {
    ...mapMutations(["addAlert", "removeAlert"]),
  }
}