
import {Component, Inherited, Vue} from "./global";


describe("VueCpuInherited", () => {

    test("One-Level-Of-Inherited", () => {

        const button = new Button();
        expect(button.getText()).toBe("Button");
        expect(button.getShortText()).toBe("B");

        const mainButton = new MainButton();
        expect(mainButton.getText()).toBe("MainButton");
        expect(mainButton.getShortText()).toBe("MB");

        expect(() => mainButton.getClass()).toThrow();
    });

    test("Two-Level-Of-Inherited", () => {
        const topButton = new TopButton();
        expect(topButton.getText()).toBe("TopMainButton");
        expect(topButton.onClick()).toBe("TopMainButton");
        expect(topButton.getShortText()).toBe("MB");
        expect(() => topButton.getClass()).toThrow();
    });

});

@Component({
    template: `<button class="app-button"><slot></slot></button>`
})
export class Button extends Vue {

    onClick(): string {
        return this.getText();
    }

    getText(): string {
        return "Button"
    }

    getClass(): string {
        return "getClassbutton";
    }

    getShortText(): string {
        return "B";
    }
}

@Component
export class MainButton extends Button {

    @Inherited
    getText(): string {
        return "Main" + super.getText();
    }

    /** No decorator */
    getClass(): string {
        return super.getClass();
    }

    @Inherited
    getShortText(): string {
        return "M" + super.getShortText();
    }
}

@Component
export class TopButton extends MainButton {

    @Inherited
    getText(): string {
        return "Top" + super.getText();
    }

    @Inherited
    onClick(): string {
        return super.onClick();
    }
}