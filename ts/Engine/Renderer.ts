import { container } from "../inversify.config";
import { injectable } from "inversify";
import { Mesh } from "./Mesh";
import { Camera } from "./Camera";
import { Device } from "./Device";
import { Vector3 } from "../Models/Vector3";
import { Panel } from "../Panel";
import { ShadingType } from "../Models/Shading";
import { Illumination, Light, Reflector } from "../Models/Illumination";
import { Scene } from "./Scene";

@injectable()
export class Renderer {
    private canvas: HTMLCanvasElement;
    private panel: Panel;
    private device: Device;
    private camera: Camera;
    private scene: Scene;
    private meshes: Mesh[];
    private lights: Light[];
    private shading: ShadingType;
    private illumination: Illumination;
    private previousDate: number;

    constructor(canvas: HTMLCanvasElement, panel: Panel, scene: Scene) {
        this.canvas = canvas;
        this.panel = panel;
        this.scene = scene;
    }

    public init() {
        this.device = new Device(this.canvas);
        this.camera = this.scene.camera;
        this.meshes = this.scene.getMeshes();
        this.lights = this.scene.getLights();
        this.addListeners();

        this.previousDate = performance.now();
        requestAnimationFrame(this.render);
    }

    private addListeners() {
        this.panel.addListener("shading-change", (shading: "Phong" | "Gouraud" | "Flat") => {
            this.shading = shading === "Phong" ? ShadingType.Phong : shading === "Gouraud" ? ShadingType.Gouraud : ShadingType.Flat;
        });

        this.panel.addListener("illumination-change", (illumination: "Phong" | "Blinn") => {
            this.illumination = illumination === "Phong" ? Illumination.Phong : Illumination.Blinn;
        });
    }

    private render = () => {
        this.updateFps();

        this.device.clear();
        this.device.render(this.camera, this.meshes, this.lights, this.shading, this.illumination);

        // this.meshes.forEach(mesh => {
        //     mesh.rotation.x += 0.01;
        //     mesh.rotation.y += 0.01;
        // });

        this.scene.torus.rotation.x += 0.01;
        this.scene.torus.rotation.y += 0.01;

        requestAnimationFrame(this.render);
    }

    private updateFps() {
        let now = performance.now();
        let currentFps = 1000 / (now - this.previousDate) >> 0;
        this.previousDate = now;

        this.panel.fps.innerText = `${currentFps} FPS`;
    }
}
