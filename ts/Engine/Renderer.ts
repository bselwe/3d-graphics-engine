import { container } from "../inversify.config";
import { injectable } from "inversify";
import { Mesh } from ".//Mesh";
import { Camera } from "./Camera";
import { Device } from "./Device";
import { Vector3 } from "../Models/Vector3";

@injectable()
export class Renderer {
    private canvas: HTMLCanvasElement;
    private mesh: Mesh;
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
        this.mesh = new Mesh("Cube");
        this.meshes = [this.mesh];

        this.mesh.vertices = [
            new Vector3(0, 0, 0),
            new Vector3(1, 0, 0),
            new Vector3(1, 1, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1),
            new Vector3(1, 0, 1),
            new Vector3(1, 1, 1),
            new Vector3(0, 1, 1)
        ];
    }

    private initCamera() {
        this.camera = new Camera();
        this.camera.position = new Vector3(3, 0.5, 6);
        this.camera.target = new Vector3(0, 0.5, 0.5);
    }

    private initDevice() {
        this.device = new Device(this.canvas);
    }

    private render = () => {
        this.device.clear();
        this.device.render(this.camera, this.meshes);

        this.mesh.position.z += 0.01;

        requestAnimationFrame(this.render);
    }
}
