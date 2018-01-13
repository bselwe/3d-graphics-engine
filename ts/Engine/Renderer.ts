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
    private meshes: Mesh[];
    private camera: Camera;
    private device: Device;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
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
        this.camera.position = new Vector3(0, 0, 10);
        this.camera.target = Vector3.ZERO;
    }

    private initDevice() {
        this.device = new Device(this.canvas);
    }

    private render = () => {
        this.device.clear();
        this.device.render(this.camera, this.meshes);

        this.meshes.forEach(mesh => {
            // mesh.rotation.z += 0.005;
            mesh.position.x += 0.0025;
            mesh.position.z += 0.0025;
        });

        requestAnimationFrame(this.render);
    }
}
