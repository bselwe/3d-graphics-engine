import { injectable } from "inversify";
import { Vector3 } from "../Models/Vector3";
import { Mesh } from "./Mesh";
import { Light, Reflector } from "../Models/Illumination";
import { Camera } from "./Camera";

import monkey from "../../models/monkey.babylon.json";
import circle from "../../models/circle.babylon.json";
import train from "../../models/train.babylon.json";
import terrain from "../../models/terrain3.babylon.json";

@injectable()
export class Scene {
    staticCamera: Camera;
    followCamera: Camera;
    objectCamera: Camera;

    staticLight: Light;
    reflector: Reflector;

    terrain: Mesh;
    train: Mesh;

    constructor() {
        this.initMeshes();
        this.initLights();
        this.initCameras();
    }

    private initCameras() {
        this.staticCamera = new Camera();
        this.staticCamera.position = new Vector3(35, 60, 50);
        this.staticCamera.target = Vector3.ZERO;

        this.followCamera = new Camera();
        this.followCamera.position = new Vector3(35, 60, 50);
        this.followCamera.target = this.train.position.copy();

        this.objectCamera = new Camera();
        this.objectCamera.position = new Vector3(this.train.position.x, this.train.position.y + 20, this.train.position.z);
        this.objectCamera.target = Vector3.ZERO;
    }

    private initMeshes() {
        this.terrain = Mesh.fromBabylon(terrain)[0];
        this.train = Mesh.fromBabylon(train)[0];

        this.train.position.z = 12;
        this.train.position.y = 3;
    }

    private initLights() {
        this.staticLight = {
            position: new Vector3(10, 10, -15)
        };

        this.reflector = {
            position: new Vector3(-2, 10, 3),
            target: new Vector3(10, 0, 10)
        };
    }

    getMeshes(): Mesh[] {
        return [
            this.terrain,
            this.train
        ];
    }

    getLights(): Light[] {
        return [
            this.staticLight,
            this.reflector
        ];
    }
}
