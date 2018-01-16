import { injectable } from "inversify";
import { EventEmitter } from "eventemitter3";

@injectable()
export class Panel extends EventEmitter {
    fps: HTMLDivElement;

    constructor() {
        super();

        this.fps = <HTMLDivElement> document.getElementById("fps");
        this.configureEvents();
    }

    private configureEvents() {
        let shadings = document.getElementsByName("shading") as NodeListOf<HTMLInputElement>;
        shadings.forEach(shading => {
            shading.onchange = () => this.emit("shading-change", shading.value);
        });
    }
}
