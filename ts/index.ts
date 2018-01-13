import "reflect-metadata";

import { Application } from "./Application";
import { container } from "./inversify.config";

window.onload = bootstrap;

function bootstrap() {
    const canvasElement = document.getElementById("application-canvas");
    if (!canvasElement) {
      throw new Error("Canvas with id 'application-canvas' not found");
    }

    const canvas = <HTMLCanvasElement> canvasElement;
    container.bind<HTMLCanvasElement>(HTMLCanvasElement).toConstantValue(canvas);

    container.get(Application).init();
}
