import {Component, Prop, Vue} from "../ts/vue-cpu";

@Component({
    template: `
    <div>
        <span>User profile</span>
        <div class="row">
            <span class="td_1">First name</span>
            <input class="td_2" v-model="userProfile.firstName">
        </div>
        <div class="row">
            <span class="td_1">Last name</span>
            <input class="td_2" v-model="userProfile.lastName">
        </div>
        <button @click="onSave">Save</button>
    </div>
`
})
export class EditUserProfilePanel extends Vue {

    @Prop({required: true})
    private readonly userProfile!: UserProfile;

    private onSave(): void {
        // save logic or emit save event to parent component
    }
}

export type UserProfile = {
    firstName: string;
    lastName: string;
}