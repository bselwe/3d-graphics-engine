import { container } from "./inversify.config";
import { injectable } from "inversify";
import { Renderer } from "./Engine/Renderer";

@injectable()
export class Application {
    private renderer: Renderer;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    public async init() {
        this.renderer.init();
    }
}
