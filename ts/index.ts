import "reflect-metadata";

import { Application } from "./Application";
import { container } from "./inversify.config";

window.onload = bootstrap;

function bootstrap() {
    const canvasElement = document.getElementById("application-canvas");
    if (!canvasElement) {
        throw new Error("Canvas with id 'application-canvas' not found");
    }

    const fpsElement = document.getElementById("fps");
    if (!fpsElement) {
        throw new Error("Element with id 'fps' not found");
    }

    const canvas = <HTMLCanvasElement> canvasElement;
    container.bind<HTMLCanvasElement>(HTMLCanvasElement).toConstantValue(canvas);

    const fps = <HTMLDivElement> fpsElement;
    container.bind<HTMLDivElement>(HTMLDivElement).toConstantValue(fps);

    container.get(Application).init();
}
