# vue-cpu

Vue class and html-template processor (vue-cpu) with HOC patterns. Tools use for creating new vue-class component based on another vue-class component. Get useful and simple api for modification html-template of component: easy add or remove attributes of html-template, overwrite hooks and so on.

# Installation
npm i vue-cpu

# Dependenices
vue, vue-class-component, vue-property-decorator

# Why vue-cpu
Keep the code clean. Keep the logic of component without unnecessary junk. Keep component small. All exclusive code in one place. Help with test subsystem. Help with debug subsystem.

# Examples

Imagine that we have some component with logic for editing user profile and we needs another component for view user profile with the same fields and same info. We have to coding two components: `EditUserProfilePanel` and `ViewUserProfilePanel`. Or we have to coding one component `UserProfilePanel` with edit/view state inside it. In first case we have clean logic, but have redundant code. In second case we have not redundant code, but get some logic inside component. The first case and the second case have disadvantage. To resolve this problem we can take advantage of vue-cpu tool. At first, show `EditUserProfilePanel` component code inside editUserProfilePanel.ts.
```typescript
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
```
Imagine that we already wrote some code that make disabled panel from editable panel with vue-cpu tool and called it `DisabledPanelCpu`. Now look at the code of `ViewUserProfilePanel` panel inside viewUserProfilePanel.ts.
```typescript
export const ViewUserProfilePanel = DisabledPanelCpu.process(EditUserProfilePanel);
```
One line of code to do our needs. Of course we need describe 2 things. At first we have to show code and html-template for `ViewUserProfilePanel` component that was produced by `DisabledPanelCpu` tool. And second, we have to show code of `DisabledPanelCpu` class. Let's get started. `ViewUserProfilePanel` class was dynamically created and have html-template and source code like this one
```typescript
@Component({
    template: `
    <div>
        <span>User profile</span>
        <div class="row">
            <span class="td_1">First name</span>
            <input readonly class="td_2" :value="userProfile.firstName">
        </div>
        <div class="row">
            <span class="td_1">Last name</span>
            <input readonly class="td_2" :value="userProfile.lastName">
        </div>
        <button disabled>Save</button>
    </div>
`
})
export class ViewUserProfilePanel extends EditUserProfilePanel {
}
```

What changes happen with html-template?

 - add `readonly` attribute to input tag
 - change `v-model` attribute to `:value`
 - add `disabled` attribute to button tag
 - remove `@click` handler from button tag

And now let looks at `DisabledPanelCpu` class source code inside disabledPanelCpu.ts file
```typescript
/** Instruction that transform html-template and gets new html-template for disabled state */
class DisabledPanelInstruction implements VueCpuInstruction {

    /**
     * Base point of transform html-template:
     * - add readonly attr to input tag
     * - change v-model attr to :value
     * - add disabled attr to button tag
     * - remove handler from button tag
     */
    replace(textPart: TextPart, origClass: VueClass<Vue>): string | false {
        // process input
        if (textPart.tag === "input") {
            // 1. all inputs to be readonly
            if (textPart.type === "tag") {
                return ` readonly`;
            }
            // 2. delete any readonly attr if present
            if (textPart.type === "attr" && (textPart.attr.key === "readonly" || textPart.attr.key === ":readonly")) {
                return "";
            }
            // 3. All v-model to be :value
            if (textPart.type === "attr" && textPart.attr.key === "v-model") {
                return ` :value=${textPart.attr.value}`;
            }
        }
        // process button
        if (textPart.tag === "button") {
            // 1. all buttons to be disabled
            if (textPart.type === "tag") {
                return ` disabled`; // also you can change it to v-if="false"
            }
            // 2. delete any disabled attr if present
            if (textPart.type === "attr" && (textPart.attr.key === "disabled" || textPart.attr.key === ":disabled")) {
                return "";
            }
            // 3. remove any handlers from button
            if (textPart.type === "attr" && textPart.attr.key.charAt(0) === "@") {
                // TODO: you can modify origClass inside  modifyComponent method to cut handler functions if necessary
                return "";
            }
        }
        // nothing replace
        return false;
    }
}

/** Make new cpu class with our needs */
export const DisabledPanelCpu = VueCpu.makeCpu(new DisabledPanelInstruction());
```