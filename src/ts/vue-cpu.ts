import {AsyncComponent, Component, ComponentOptions, Vue, VueClass} from "./lib";

/**
 * Vue class and template processor, shortcut and just for fun - cpu.
 * @author evg_pal
 */
export class VueCpu {

    /** Template modifier */
    protected readonly templateModifier: VueTemplateModifier;

    /**
     * Constructor
     * @param topComponentClass target component class to be processed
     * @param instruction instruction that be applying to target component
     */
    protected constructor(private readonly topComponentClass: VueClass<Vue>, private readonly instruction: VueCpuInstruction) {
        this.templateModifier = new VueTemplateModifier(instruction);
        this.instruction?.event?.("start");
        this.addInstructionsFromGlobalComponents();
        this.addInstructionsFromTopComponent();
        this.setCustomInstructions();
    }

    /**
     * Create and return new class based on VueCpu which implements required needs
     * @param instruction instruction that be applying to target component
     */
    static makeCpu(instruction: VueCpuInstruction): typeof VueCpu & {process<T extends Vue>(componentClass: VueClass<T>): VueClass<T>} {


        /** Extends VueCpu and add new static "process" method */
        class NewFeatureCpu extends VueCpu {

                constructor(topComponentClass: VueClass<Vue>) {
                    super(topComponentClass, instruction);
                }

                /**
                 * Create and return new `VueClass` based on `componentClass` with applied instruction
                 * @param componentClass target component class to be processed
                 */
                static process<T extends Vue>(componentClass: VueClass<T>): VueClass<T> {
                    return <VueClass<T>> new this(componentClass).processTopComponent();
                }
        }
        return NewFeatureCpu;
    }

    /**
     * Create and return new `VueClass` based on `topComponentClass` with applied instruction
     */
    protected processTopComponent(): VueClass<Vue> {
        try {
            this.instruction?.event?.("replace");
            return this.processComponent(this.topComponentClass);
        } finally {
            this.instruction?.event?.("end");
        }
    }

    /**
     * Analyze all global components. See Vue.component method
     */
    protected addInstructionsFromGlobalComponents(): void {
        this.addInstructionsFromComponent(null, Vue);
    }

    /**
     * Analyze all declaring components inside `topComponentClass` in components section
     */
    protected addInstructionsFromTopComponent(): void {
        this.addInstructionsFromComponent(null, this.topComponentClass);
    }

    /**
     * To be custom code (nothing now)
     */
    protected setCustomInstructions(): void {
    }

    /**
     * Add instructions from `componentClass` with `tag` name
     * @param tag tag-name of component that use inside template
     * @param componentClass the class of the component that is being processed
     */
    protected addInstructionsFromComponent(tag: string, componentClass: VueClass<Vue>): void {
        const compOptions: ComponentOptions<Vue> = (<any> componentClass).options;
        this.addInstructionFromOptions(tag, componentClass, compOptions);
        for (const compTag of Object.keys(compOptions.components)) {
            const childComponentClass: VueClass<Vue> & {options: ComponentOptions<Vue>} = <any> compOptions.components[compTag];
            if (typeof compTag === "string" && componentClass !== childComponentClass && childComponentClass?.options) {
                this.addInstructionsFromComponent(compTag, childComponentClass);
            }
        }
    }

    /**
     * Add instructions from `componentClass` with `tag` name. Hook for instruction object
     * @param tag tag-name
     * @param componentClass the class of the component that is being processed
     * @param options the component options
     */
    protected addInstructionFromOptions(tag: string, componentClass: VueClass<Vue>, options: ComponentOptions<Vue>): void {
        this.instruction?.analyzeOptions?.(tag, options, componentClass);
    }

    /**
     * Create and return new `VueClass` based on `componentClass` with applied instruction
     * @param componentClass component class to be processed
     */
    protected processComponent(componentClass: VueClass<Vue>): VueClass<Vue> {
        const originalOptions: ComponentOptions<Vue> = (<any> componentClass).options;
        const subOptions: ComponentOptions<Vue> = {};
        subOptions.template = this.templateModifier.modifyTemplate(originalOptions.template, componentClass);
        // Uncomment it for comparing template before and after
        // window.console.log(">>>> DEBUG.template", originalOptions.template, subOptions.template);
        subOptions.components = this.processComponents(componentClass, <ComponentMap> originalOptions.components);
        const newBaseComponentClass = this.instruction?.modifyComponent?.(componentClass) || componentClass;
        @Component(subOptions)
        class ProcessedComponent extends newBaseComponentClass {}
        return ProcessedComponent;
    }

    /**
     * Process children components.
     * @param componentClass 'parent' class component
     * @param origComponents map of 'children' components
     */
    protected processComponents(componentClass: VueClass<Vue>, origComponents: ComponentMap): ComponentMap {
        const components: ComponentMap = {};
        for (const key of Object.keys(origComponents)) {
            const origComponentClass = <any> origComponents[key];
            if (typeof key === "string" && componentClass !== origComponentClass && origComponentClass?.options) {
                components[key] = this.processComponent(origComponentClass);
            }
        }
        return components;
    }
}

/** Component Map Type */
type ComponentMap = {[key: string]: VueClass<Vue> | AsyncComponent};

/**
 * Vue Template modifier
 */
class VueTemplateModifier {

    /** Vue template scanner */
    private readonly scanner = new VueTemplateScanner();
    /** Target instruction */
    constructor(private readonly instruction: VueCpuInstruction) {}

    /**
     * Modify and return template of vue component
     * @param template template of vue component
     * @param vueClass component class
     * @returns template with modifications
     */
    modifyTemplate(template: string, vueClass: VueClass<Vue>): string {
        return this.scanner.scan(template, (textPart) => this.applyTagInstructions(textPart, vueClass));
    }

    /**
     * Apply instruction for text part.
     * @param textPart text part to be processed
     * @param vueClass component class
     */
    private applyTagInstructions(textPart: TextPart, vueClass: VueClass<Vue>): string | false {
        return this.instruction?.replace(textPart, vueClass) ?? false;
    }
}

/**
 * Vue Template Scanner.
 * Moving by text part and call function to modify it
 */
class VueTemplateScanner {

    /**
     * Moving by text part step by step and call function to modify it
     * @param template template to be processed
     * @param modifier modifier function. If return `false` - nothing to do, otherwise replace new text instead of current
     */
    scan(template: string, modifier: (textPart: TextPart) => string | false): string {
        let modifiedTemplate = "";
        let index = 0;
        let lastIndex = index;
        // 0 - tag parser state
        // 1 - attribute parser state
        let state = 0;
        let tagInfo = {tagName: "", index: -1};
        let attrs: Array<{key: string, value: string, startPos: number, pos: number}> = [];
        while (index < template.length) {
            // open tag
            if (state === 0) {
                if (template[index] === "<" && template[index + 1] !== "/") {
                    const tagName = this.parseTagName(index + 1, template);
                    index += tagName.length + 1;
                    const checkSymbol = template[index].trim();
                    const nextState = checkSymbol === "";
                    const singleTag = checkSymbol === "/" || checkSymbol === ">";
                    if (singleTag) {
                        const changed = modifier({tag: tagName, attrMap: {}, type: "tag"}); // open tag
                        if (changed !== false) {
                            modifiedTemplate += template.substring(lastIndex, index);
                            modifiedTemplate += changed;
                            lastIndex = index;
                        }
                        index++;
                        continue;
                    }
                    if (nextState) {
                        tagInfo.tagName = tagName;
                        tagInfo.index = index;
                        state = 1;
                        continue;
                    }
                }
                index++;
                continue;
            }
            // attributes
            if (state === 1) {
                const attrInfo = this.parseAttribute(index, template);
                const startAttrIndex = index;
                index = attrInfo.pos;
                const attr = attrInfo.attr;
                if (attr === null) {
                    const attrMap: TextPart["attrMap"] = {};
                    attrs.forEach(newAttrs => {
                        attrMap[newAttrs.key] = {key: newAttrs.key, value: newAttrs.value}
                    });
                    // replace tag needs
                    const changedTag = modifier({tag: tagInfo.tagName, attrMap, type: "tag"}); // open tag
                    if (changedTag !== false) {
                        modifiedTemplate += template.substring(lastIndex, tagInfo.index);
                        modifiedTemplate += changedTag;
                        lastIndex = tagInfo.index;
                    }
                    // replace attrs needs
                    for (const processedAttr of attrs) {
                        const nextAttr = attrMap[processedAttr.key];
                        const changed = modifier({tag: tagInfo.tagName, attr: nextAttr, attrMap, type: "attr"}); // open tag
                        if (changed !== false) {
                            modifiedTemplate += template.substring(lastIndex, processedAttr.startPos);
                            modifiedTemplate += changed;
                            lastIndex = processedAttr.pos;
                        }
                    }
                    tagInfo = {tagName: "", index: -1};
                    state = 0;
                    attrs = [];
                    continue;
                }
                attrs.push({...attr, startPos: startAttrIndex, pos: index});
            }
        }
        modifiedTemplate += template.substring(lastIndex, index);
        return modifiedTemplate;
    }

    /**
     * Parse tag name
     * @param indexFrom index from
     * @param template  template to parse
     */
    private parseTagName(indexFrom: number, template: string): string {
        let index = indexFrom;
        while (index < template.length) {
            const symbol = template[index];
            if (">/<\n\r ".includes(symbol) || symbol.trim() === "") {
                break;
            }
            index++;
        }
        return template.substring(indexFrom, index).trim();
    }

    /**
     * Parse attribute info
     * @param indexFrom index from
     * @param template template to parse
     */
    private parseAttribute(indexFrom: number, template: string): {attr: Attribute, pos: number} {
        const attrubute: Attribute = {key: null, value: null};
        let index = indexFrom;
        // skip whitespaces
        while (index < template.length && template[index].trim() === "") {
            index++;
        }
        // check end-of
        if (">/".includes(template[index])) {
            return {attr: null, pos: index};
        }
        // parse attribute:  A="B"
        const beginAttrNameIndex = index;
        // parse A=
        while (index < template.length) {
            let symbol = template[index];
            // for example: readonly
            if (symbol.trim() === "" || ">/".includes(symbol)) {
                // skip whitespaces
                if (symbol.trim() === "") {
                    while (index < template.length && template[index].trim() === "") {
                        index++;
                        symbol = template[index];
                    }
                }
                if (symbol !== "=") {
                    attrubute.key = template.substring(beginAttrNameIndex, index).trim();
                    return {attr: attrubute, pos: index};
                }
            }
            // for example: v-model=
            if (symbol === "=") {
                attrubute.key = template.substring(beginAttrNameIndex, index);
                index++;
                break;
            }
            index++;
        }
        // skip whitespaces
        while (index < template.length && template[index].trim() === "") {
            index++;
        }
        const beginAttrValueIndex = index;
        // parse "B"
        if (template[index] !== `"`) {
            let newLineIndex = template.indexOf("\n", beginAttrNameIndex);
            if (newLineIndex === -1) {
                newLineIndex = template.length;
            }
            throw new Error(`Template\n: ${template}\n is not valid. ` +
                `Expected '"' got '${template[index]}'. ` +
                `Index from ${indexFrom}, attrNameFrom ${beginAttrNameIndex}. ` +
                `Last scan at '${template.substring(beginAttrNameIndex, newLineIndex)}...'`);
        }
        index++;
        while (index < template.length) {
            const symbol = template[index];
            // quote inside quote: not supported inside vue -> use &quot; instead
            if (symbol === `"`) {
                index++;
                attrubute.value = template.substring(beginAttrValueIndex, index);
                return {attr: attrubute, pos: index};
            }
            index++;
        }
        let eolIndex = template.indexOf("\n", beginAttrValueIndex);
        if (eolIndex === -1) {
            eolIndex = template.length;
        }
        throw new Error(`Template\n: ${template}\n is not valid. ` +
                `Expected '"' got '${template[index]}'. ` +
                `Index from ${indexFrom}, attrNameFrom ${beginAttrNameIndex}, attrValueFrom ${beginAttrValueIndex}. ` +
                `Last scan at '${template.substring(beginAttrValueIndex, eolIndex)}...'`);
    }
}

/** Attribute type. Keep pair `key=value`, for example `class="bold"` or `:class="classGetter"` */
export type Attribute = {
    /** Attribute name, for example 'class' or ':class' */
    key: string,
    /** Attribute value, to be quoted text. For example 'bold' or 'classGetter' */
    value: string
};

/** Vue Cpu Instruction. Contains base methods for user needs */
export type VueCpuInstruction = {

    /**
     * Forms new text or expressions for user needs or keep it unchangeable
     * @param textPart text part to be processed
     * @param origClass component class
     * @returns `false` - nothing to do, otherwise replace new text instead of current
     */
    replace(textPart: TextPart, origClass: VueClass<Vue>): string | false;

    /**
     * Some trigger points of process
     * @param eventType `start` - event about beginning, `end` - event about end of process, `replace` event about replacing
     */
    event?(eventType: "start" | "end" | "replace"): void;

    /**
     * Analyze options hook
     * @param tag tag-name or null. Null are using to define top component or direct vue component
     * @param options: component options
     * @param origClass component class
     */
    analyzeOptions?(tag: string, options: ComponentOptions<Vue>, origClass: VueClass<Vue>): void;

    /**
     * Modify component class hook
     * @param origClass component class
     * @return new class based on `origClass` or null, if modification don't need
     */
    modifyComponent?(origClass: VueClass<Vue>): VueClass<Vue>;
}

/**
 * Text Part Holder Type. Contains tag-name, attributes info and `type` about text part: tag or attr to be processed
 */
export type TextPart = {
    tag: string,
    attrMap: {[key: string]: Attribute}
    readonly type: "tag"
} | {
    tag: string,
    attr: Attribute,
    attrMap: {[key: string]: Attribute}
    readonly type: "attr"
};