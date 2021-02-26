import {VueClass} from "../ts/lib";
import {TextPart, VueCpu, VueCpuInstruction} from "../ts/vue-cpu";

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
                return ` disabled`;
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

export const DisabledPanelCpu = VueCpu.makeCpu(new DisabledPanelInstruction());
