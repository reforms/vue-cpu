import {Component, ComponentOptions, Prop, Vue, VueClass} from "../ts/vue-cpu";

@Component({
    // language=Vue
    template: `
    <span v-if="readonly"><slot></slot></span>
    <a v-else :href="href" :target="href ? target : null" @click="$emit('click')"><slot></slot></a>
`
})
export class UiLink extends Vue {

    @Prop({default: false})
    private readonly readonly!: boolean;

    /** Addres */
    @Prop()
    private readonly href!: string;

    /** Target */
    @Prop()
    private readonly target!: string;
}

@Component({
    template: `
    <button :disabled="readonly" class="app-button"><slot></slot></button>
`
})
export class UiButton extends Vue {

    @Prop({default: false})
    private readonly readonly!: boolean;
}

@Component({
    // language=Vue
    template: `
<div class="app-toolbar">
    <slot></slot>
</div>
`,
})
export class UiToolbar extends Vue {
}

@Component({
    // language=Vue
    template: `
        <div class="app-footer">
            <ui-link href="/about">About</ui-link>
            <ui-link href="/help">Help</ui-link>
        </div>
`,
    components: {
        "ui-link": UiLink
    }
})
export class UiFooter extends Vue {
}

export function getComponent(template: string): VueClass<Vue> {
    @Component({template}) class Comp extends Vue {};
    return Comp;
}

export function getTemplate(vueClass: VueClass<Vue>): string  {
    const originalOptions: ComponentOptions<Vue> = (<any> vueClass).options;
    return originalOptions.template || "";
}
