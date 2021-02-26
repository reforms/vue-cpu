
import {getComponent, getTemplate} from "./components";
import {AddBoldClassToSpanCpu, ReadonlyCpu, RemoveHandlersCpu} from "./instructions";


describe("VueCpu", () => {

    test("Add-Readonly-Cpu", () => {

        // input
        const SimpleActivePanel = getComponent(`
            <div>
                <ui-link href="/link1" target="self" :readonly="false">Link1</ui-link>
                <ui-link href="/link2">Link2</ui-link>
                <ui-button @click="console.log('<')">Button1</ui-button>
                <ui-button>Button2</ui-button>
            </div>
        `);

        // toBe
        const templateToBe = `
            <div>
                <ui-link :readonly="true" href="/link1" target="self">Link1</ui-link>
                <ui-link :readonly="true" href="/link2">Link2</ui-link>
                <ui-button :readonly="true" @click="console.log('<')">Button1</ui-button>
                <ui-button :readonly="true">Button2</ui-button>
            </div>
        `;

        const SimpleReadonlyPanelActual = ReadonlyCpu.process(SimpleActivePanel);
        const templateActual = getTemplate(SimpleReadonlyPanelActual);
        compareTemplates(templateActual, templateToBe);
    });

    test("Remove-Handlers-Cpu", () => {

        // input
        const SimplePanel = getComponent(`
            <div>
                <ui-button @click="console.log('Hi1')">Button1</ui-button>
                <ui-button @click="console.log('Hi2')">Button2</ui-button>
            </div>
        `);

        // toBe
        const templateToBe = `
            <div>
                <ui-button>Button1</ui-button>
                <ui-button>Button2</ui-button>
            </div>
        `;

        const SimplePanelActual = RemoveHandlersCpu.process(SimplePanel);
        const templateActual = getTemplate(SimplePanelActual);
        compareTemplates(templateActual, templateToBe);
    });

    test("Add-Bold-Class-To-Span-Instruction-Cpu", () => {

        // input
        const SimplePanel = getComponent(`
            <div>
                <span class="red">SomeText1</span>
                <span>SomeText2</span>
                <span data-value="hack">SomeText3</span>
                <span class="red bold">SomeText4</span>
                <span data-value="hack" class="green bold">SomeText5</span>
                <span data-value="hack" class="blue">SomeText6</span>
            </div>
        `);

        // toBe
        const templateToBe = `
            <div>
                <span class="bold red">SomeText1</span>
                <span class="bold">SomeText2</span>
                <span class="bold" data-value="hack">SomeText3</span>
                <span class="red bold">SomeText4</span>
                <span data-value="hack" class="green bold">SomeText5</span>
                <span data-value="hack" class="bold blue">SomeText6</span>
            </div>
        `;

        const SimplePanelActual = AddBoldClassToSpanCpu.process(SimplePanel);
        const templateActual = getTemplate(SimplePanelActual);
        compareTemplates(templateActual, templateToBe);
    });

    function compareTemplates(templateActual: string, templateToBe: string): void {
        const nTemplateActual = templateActual.replace(/ {2,}/g, "");
        const nTemplateToBe = templateToBe.replace(/ {2,}/g, "");
        expect(nTemplateActual).toBe(nTemplateToBe);
    }
});