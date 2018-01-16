import { container } from "../inversify.config";
import { injectable } from "inversify";
import { Mesh } from ".//Mesh";
import { Camera } from "./Camera";
import { Device } from "./Device";
import { Vector3 } from "../Models/Vector3";
import { Panel } from "../Panel";
import { ShadingType } from "../Models/Shading";

import monkey from "../../models/monkey.babylon.json";
import torus from "../../models/torus.babylon.json";
import circle from "../../models/circle.babylon.json";

@injectable()
export class Renderer {
    private canvas: HTMLCanvasElement;
    private panel: Panel;
    private device: Device;
    private camera: Camera;
    private meshes: Mesh[];
    private lightPosition: Vector3;
    private shading: ShadingType;
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
        this.camera.position = new Vector3(0, -5, 8);
        this.camera.target = Vector3.ZERO;
    }

    private initDevice() {
        this.device = new Device(this.canvas);
    }

    private addListeners() {
        this.panel.addListener("shading-change", (shading: string) => {
            this.shading = shading === "Phong" ? ShadingType.Phong : shading === "Gouraud" ? ShadingType.Gouraud : ShadingType.Flat;
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
