import {Vue, VueClass} from "../ts/lib";
import {TextPart, VueCpu, VueCpuInstruction} from "../ts/vue-cpu";

class ReadonlyAddInstruction implements VueCpuInstruction {

    replace(textPart: TextPart, origClass: VueClass<Vue>): string | false {
        if (textPart.tag === "ui-link" || textPart.tag === "ui-button") {
            // always add readonly attr as first of tag element
            if (textPart.type === "tag") {
                return ` :readonly="true"`;
            }
            if (textPart.type === "attr" && (textPart.attr.key === "readonly" || textPart.attr.key === ":readonly")) {
                // delete readonly if present
                return "";
            }
        }
        // nothing replace
        return false;
    }
}

export const ReadonlyCpu = VueCpu.makeCpu(new ReadonlyAddInstruction());

class RemoveHadlersInstruction implements VueCpuInstruction {

    replace(textPart: TextPart, origClass: VueClass<Vue>): string | false {
        // check if handler declaration
        if (textPart.type === "attr" && textPart.attr.key.charAt(0) === "@") {
            return "";
        }
        // nothing replace
        return false;
    }
}

export const RemoveHandlersCpu = VueCpu.makeCpu(new RemoveHadlersInstruction());

class AddBoldClassToSpanInstruction implements VueCpuInstruction {

    replace(textPart: TextPart, origClass: VueClass<Vue>): string | false {
        if (textPart.tag === "span") {
            // add bold class, if class attr missing
            if (textPart.type === "tag" && !textPart.attrMap["class"]) {
                return ` class="bold"`;
            }
            // add bold class to class value
            if (textPart.type === "attr" && textPart.attr.key === "class" && textPart.attrMap["class"] &&
                textPart.attrMap["class"].value.split(/[" ]/g).indexOf("bold") === -1) {
                const classValue = textPart.attrMap["class"].value;
                return ` class="bold ${classValue.substring(1)}`;
            }
        }
        // nothing replace
        return false;
    }
}

export const AddBoldClassToSpanCpu = VueCpu.makeCpu(new AddBoldClassToSpanInstruction());
