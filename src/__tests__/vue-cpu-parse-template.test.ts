
import {getComponent} from "./components";
import {Attribute, TextPart, VueClass, VueCpu, VueCpuInstruction} from "./global";

describe("VueCpuParseTemplate", () => {

    test("ParseEmpty", () => {
        const component = getComponent("");
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(0);
    });
    test("ParseSingleNode", () => {
        const component1 = getComponent("<div/>");
        CalcInstructionCpu.process(component1);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("div");

        const component2 = getComponent("<div></div>");
        CalcInstructionCpu.process(component2);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("div");
    });
    test("ParseSingleNodeWithExprText", () => {
        const component = getComponent("<span>Чистый лист: {{ok ? 'YES' : 'NO' }}</span>");
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("span");
    });
    test("ParseSingleNodeWithDiffStyleWrote", () => {
        const component1 = getComponent("<divlist/>");
        CalcInstructionCpu.process(component1);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("divlist");

        const component2 = getComponent("<div-list></div-list>");
        CalcInstructionCpu.process(component2);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("div-list");

        const component3 = getComponent("<DivList></DivList>");
        CalcInstructionCpu.process(component3);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("DivList");

        const component4 = getComponent("<div_list></div_list>");
        CalcInstructionCpu.process(component4);
        expect(instruction.tags.length).toBe(1);
        expect(instruction.tags[0].tag).toBe("div_list");
    });
    test("ParseNesstedNode", () => {
        const component = getComponent("<div><child></child></div>");
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(2);
        expect(instruction.tags[0].tag).toBe("div");
        expect(instruction.tags[1].tag).toBe("child");
    });
    test("ParseNesstedNotClosedNode", () => {
        const component = getComponent("<div><child></div>");
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(2);
        expect(instruction.tags[0].tag).toBe("div");
        expect(instruction.tags[1].tag).toBe("child");
    });
    test("ParseNesstedNodeInsideText", () => {
        const component = getComponent(`<p>Директива v-html: <span v-html="rawHtml"></span></p>`);
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(2);
        expect(instruction.tags[0].tag).toBe("p");
        const tagStruct = instruction.tags[1];
        expect(tagStruct.tag).toBe("span");
        expect(tagStruct.attrMap["v-html"].key).toBe("v-html");
        expect(tagStruct.attrMap["v-html"].value).toBe(`"rawHtml"`);
    });
    test("Parse100LevelOfNesstedNode", () => {
        const max = 100;
        const tagName = "some_node";
        const closeTags: string[] = [];
        let template = "";
        for (let index = 0; index < max; index++) {
            template += `<${tagName}${index}>`;
            closeTags.unshift(`</${tagName}${index}>`);
        }
        for (const closedTagName of closeTags) {
            template += closedTagName;
        }
        const component = getComponent(template);
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(max);
        for (let index = 0; index < max; index++) {
            expect(instruction.tags[index].tag).toBe(`${tagName}${index}`);
        }
    });
    test("ParseSingleAttribute", () => {
        const component = getComponent(`<div id="1"/>`);
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(1);
        const tagStruct = instruction.tags[0];
        expect(tagStruct.tag).toBe("div");
        expect(tagStruct.attrMap.id).toBeTruthy();
        expect(tagStruct.attrMap.id.key).toBe("id");
        expect(tagStruct.attrMap.id.value).toBe(`"1"`);
    });
    test("ParseTwoAttributes", () => {
        const component = getComponent(`<div id="2" @onclick="submit()"/>`);
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(1);
        const tagStruct = instruction.tags[0];
        expect(tagStruct.tag).toBe("div");
        expect(tagStruct.attrMap.id).toBeTruthy();
        expect(tagStruct.attrMap.id.key).toBe("id");
        expect(tagStruct.attrMap.id.value).toBe(`"2"`);
        expect(tagStruct.attrMap["@onclick"].key).toBe("@onclick");
        expect(tagStruct.attrMap["@onclick"].value).toBe(`"submit()"`);
    });
    test("ParseDiffAttributes", () => {
        const component = getComponent(`
            <div id="3"
                    @onclick="click()"
                    @click.stop
                    v-focus
                    v-directive:foo
                    v-directive.foo.bar
                    v-directive.one.two="one or two"
                    v-demo:foo.a.b="message"
                    :key="someKey"
            />`);
        CalcInstructionCpu.process(component);
        expect(instruction.tags.length).toBe(1);
        const tagStruct = instruction.tags[0];
        expect(tagStruct.tag).toBe("div");
        expect(tagStruct.attrMap.id).toBeTruthy();
        expect(tagStruct.attrMap.id.key).toBe("id");
        expect(tagStruct.attrMap.id.value).toBe(`"3"`);
        expect(tagStruct.attrMap["@onclick"].key).toBe("@onclick");
        expect(tagStruct.attrMap["@onclick"].value).toBe(`"click()"`);
        expect(tagStruct.attrMap["v-focus"].key).toBe("v-focus");
        expect(tagStruct.attrMap["v-focus"].value).toBeNull();
        expect(tagStruct.attrMap["v-directive:foo"].key).toBe("v-directive:foo");
        expect(tagStruct.attrMap["v-directive:foo"].value).toBeNull();
        expect(tagStruct.attrMap["v-directive.foo.bar"].key).toBe("v-directive.foo.bar");
        expect(tagStruct.attrMap["v-directive.foo.bar"].value).toBeNull();
        expect(tagStruct.attrMap["v-directive.one.two"].key).toBe("v-directive.one.two");
        expect(tagStruct.attrMap["v-directive.one.two"].value).toBe(`"one or two"`);
        expect(tagStruct.attrMap["v-demo:foo.a.b"].key).toBe("v-demo:foo.a.b");
        expect(tagStruct.attrMap["v-demo:foo.a.b"].value).toBe(`"message"`);
        expect(tagStruct.attrMap[":key"].key).toBe(":key");
        expect(tagStruct.attrMap[":key"].value).toBe(`"someKey"`);
    });
});

class CalcInstruction implements VueCpuInstruction {

    tags: TagStruct[] = [];

    event(eventType: "start" | "end" | "replace"): void {
        if (eventType === "start") {
            this.tags = [];
        }
    }

    replace(textPart: TextPart, origClass: VueClass<Vue>): string | false {
        if (textPart.type === "tag") {
            this.tags.push(textPart);
        }
        return false;
    }
}
const instruction = new CalcInstruction();

const CalcInstructionCpu = VueCpu.makeCpu(instruction);

/** Тип тэга структуры */
type TagStruct = {
    tag: string;
    attrMap: {[key: string]: Attribute};
};