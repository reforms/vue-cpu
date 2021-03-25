import type {AsyncComponent, ComponentOptions} from "vue";
import {Component, Prop, Vue} from "vue-property-decorator";
import {Attribute, Inherited, TextPart, VueCpu, VueCpuInstruction} from "../ts/vue-cpu";

/** Vue Class. See "vue-class-component/lib/declarations" */
declare type VueClass<V> = {
    new (...args: any[]): V & Vue;
} & typeof Vue;

/** Reexport base lib imports */
export {
    Attribute,
    AsyncComponent,
    ComponentOptions,
    Inherited,
    TextPart,
    VueCpuInstruction,
    Vue, VueCpu, Component, VueClass, Prop
};
