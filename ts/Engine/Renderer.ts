import { container } from "../inversify.config";
import { injectable } from "inversify";
import { Mesh } from ".//Mesh";
import { Camera } from "./Camera";
import { Device, Shading } from "./Device";
import { Vector3 } from "../Models/Vector3";
import torus from "../../models/torus.babylon.json";
import monkey from "../../models/monkey.babylon.json";
import { Panel } from "../Panel";

@injectable()
export class Renderer {
    private canvas: HTMLCanvasElement;
    private panel: Panel;
    private device: Device;
    private camera: Camera;
    private meshes: Mesh[];
    private lightPosition: Vector3;
    private shading: Shading;
    private previousDate: number;

    constructor(canvas: HTMLCanvasElement, panel: Panel) {
        this.canvas = canvas;
        this.panel = panel;
        this.lightPosition = new Vector3(0, 10, 10);
        this.previousDate = performance.now();
    }

    public init() {
        this.initMeshes();
        this.initCamera();
        this.initDevice();
        this.addListeners();

        requestAnimationFrame(this.render);
    }

    private initMeshes() {
        this.meshes = Mesh.fromBabylon(torus);
    }

    private initCamera() {
        this.camera = new Camera();
        this.camera.position = new Vector3(0, -5, 5);
        this.camera.target = Vector3.ZERO;
    }

    private initDevice() {
        this.device = new Device(this.canvas);
    }

    private addListeners() {
        this.panel.addListener("shading-change", (shading: string) => {
            this.shading = shading === "Phong" ? Shading.Phong : Shading.Gouraud;
        });
    }

    private render = () => {
        this.updateFps();

        this.device.clear();
        this.device.render(this.camera, this.meshes, this.lightPosition, this.shading);

        this.meshes.forEach(mesh => {
            mesh.rotation.z -= 0.02;
        });

        requestAnimationFrame(this.render);
    }

    private updateFps() {
        let now = performance.now();
        let currentFps = 1000 / (now - this.previousDate) >> 0;
        this.previousDate = now;

        this.panel.fps.innerText = `${currentFps} FPS`;
    }
}
