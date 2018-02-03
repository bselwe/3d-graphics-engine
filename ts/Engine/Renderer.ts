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
import { KeyTracker, Key } from "../KeyTracker";

@injectable()
export class Renderer {
    private canvas: HTMLCanvasElement;
    private panel: Panel;
    private keyTracker: KeyTracker;
    private device: Device;
    private camera: Camera;
    private scene: Scene;
    private meshes: Mesh[];
    private lights: Light[];
    private shading: ShadingType;
    private illumination: Illumination;
    private previousDate: number;
    private readonly cameraMovementStep = 0.5;
    private readonly cameraRotationStep = 0.5;

    private readonly radius = 1;
    private readonly interval = 0.07;
    private readonly theta = 5;
    private alpha = 0;
    private counter = 0;

    constructor(canvas: HTMLCanvasElement, panel: Panel, keyTracker: KeyTracker, scene: Scene) {
        this.canvas = canvas;
        this.panel = panel;
        this.keyTracker = keyTracker;
        this.scene = scene;
    }

    public init() {
        this.device = new Device(this.canvas);
        this.camera = this.scene.staticCamera;
        this.meshes = this.scene.getMeshes();
        this.lights = this.scene.getLights();
        this.addListeners();

        this.previousDate = performance.now();
        requestAnimationFrame(this.render);
    }

    private addListeners() {
        this.panel.addListener("camera-change", (camera: "Static" | "Follow" | "Object") => {
            this.camera = camera === "Static" ? this.scene.staticCamera : camera === "Follow" ? this.scene.followCamera : this.scene.objectCamera;
        });

        this.panel.addListener("shading-change", (shading: "Phong" | "Gouraud" | "Flat") => {
            this.shading = shading === "Phong" ? ShadingType.Phong : shading === "Gouraud" ? ShadingType.Gouraud : ShadingType.Flat;
        });

        this.panel.addListener("illumination-change", (illumination: "Phong" | "Blinn") => {
            this.illumination = illumination === "Phong" ? Illumination.Phong : Illumination.Blinn;
        });
    }

    private render = () => {
        this.updateFps();
        this.updateCameras();
        this.updateMeshes();

        this.device.clear();
        this.device.render(this.camera, this.meshes, this.lights, this.shading, this.illumination);

        requestAnimationFrame(this.render);
    }

    private updateCameras() {
        if (this.camera === this.scene.followCamera) {
            this.camera.target = this.scene.train.position.copy();
        }

        if (this.camera === this.scene.objectCamera) {
            this.camera.position = new Vector3(this.scene.train.position.x, this.scene.train.position.y + 20, this.scene.train.position.z);
        }

        if (this.camera === this.scene.objectCamera) {
            return;
        }

        let d = Vector3.difference(this.camera.target, this.camera.position).normalize().scale(1);

        if (this.keyTracker.keys[Key.W]) {
            let v = Vector3.difference(this.camera.target, this.camera.position).normalize();
            this.camera.position.add(v);
            this.camera.target.add(v);
        }
        if (this.keyTracker.keys[Key.S]) {
            let v = Vector3.difference(this.camera.position, this.camera.target).normalize();
            this.camera.position.add(v);
            this.camera.target.add(v);
        }
        if (this.keyTracker.keys[Key.A]) {
            this.camera.position.x += this.cameraMovementStep;
            this.camera.target.x += this.cameraMovementStep;
        }
        if (this.keyTracker.keys[Key.D]) {
            this.camera.position.x -= this.cameraMovementStep;
            this.camera.target.x -= this.cameraMovementStep;
        }

        if (this.camera === this.scene.followCamera) {
            return;
        }

        if (this.keyTracker.keys[Key.UP]) {
            this.camera.target.y += this.cameraRotationStep;
        }
        if (this.keyTracker.keys[Key.DOWN]) {
            this.camera.target.y -= this.cameraRotationStep;
        }
        if (this.keyTracker.keys[Key.LEFT]) {
            this.camera.target.x += this.cameraRotationStep;
        }
        if (this.keyTracker.keys[Key.RIGHT]) {
            this.camera.target.x -= this.cameraMovementStep;
        }
    }

    private updateMeshes() {
        // this.meshes.forEach(mesh => {
        //     mesh.rotation.x += 0.01;
        //     mesh.rotation.y += 0.01;
        // });

        this.scene.train.rotation.x += 0.01;
        this.scene.train.rotation.y += 0.01;

        let x = this.radius * Math.cos(this.theta);
        let y = 0;
        let z = this.radius * Math.sin(this.theta);
        let deltaX = z * Math.cos(this.alpha) - x * Math.sin(this.alpha);
        let deltaZ = x * Math.cos(this.alpha) + z * Math.sin(this.alpha);

        this.scene.train.position.x += deltaX;
        this.scene.train.position.y += y;
        this.scene.train.position.z += deltaZ;

        this.scene.reflector.position = new Vector3(this.scene.train.position.x, this.scene.train.position.y - 4, this.scene.train.position.z);

        this.alpha += this.interval;
    }

    private updateFps() {
        let now = performance.now();
        let currentFps = 1000 / (now - this.previousDate) >> 0;
        this.previousDate = now;

        this.panel.fps.innerText = `${currentFps} FPS`;
    }
}
