import { container } from "../inversify.config";
import { injectable } from "inversify";
import { Mesh } from ".//Mesh";
import { Camera } from "./Camera";
import { Device } from "./Device";
import { Vector3 } from "../Models/Vector3";
import monkey from "../../models/monkey.babylon.json";

@injectable()
export class Renderer {
    private canvas: HTMLCanvasElement;
    private fps: HTMLDivElement;
    private previousDate: number;
    private meshes: Mesh[];
    private camera: Camera;
    private device: Device;

    constructor(canvas: HTMLCanvasElement, fps: HTMLDivElement) {
        this.canvas = canvas;
        this.fps = fps;
        this.previousDate = performance.now();
    }

    public init() {
        this.initMeshes();
        this.initCamera();
        this.initDevice();

        requestAnimationFrame(this.render);
    }

    private initMeshes() {
        this.meshes = Mesh.fromBabylon(monkey);
    }

    private initCamera() {
        this.camera = new Camera();
        this.camera.position = new Vector3(3, -2, -8);
        this.camera.target = Vector3.ZERO;
    }

    private initDevice() {
        this.device = new Device(this.canvas);
    }

    private render = () => {
        this.updateFps();

        this.device.clear();
        this.device.render(this.camera, this.meshes);

        this.meshes.forEach(mesh => {
            mesh.rotation.z += 0.003;
            mesh.position.x += 0.005;
            mesh.position.y -= 0.002;
        });

        requestAnimationFrame(this.render);
    }

    private updateFps() {
        let now = performance.now();
        let currentFps = 1000 / (now - this.previousDate) >> 0;
        this.previousDate = now;

        this.fps.innerText = `${currentFps} FPS`;
    }
}
