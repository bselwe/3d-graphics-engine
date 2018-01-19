import { injectable } from "inversify";
import { Vector3 } from "../Models/Vector3";
import { Mesh } from "./Mesh";
import { Light, Reflector } from "../Models/Illumination";
import { Camera } from "./Camera";

import monkey from "../../models/monkey.babylon.json";
import torus from "../../models/torus.babylon.json";
import circle from "../../models/circle.babylon.json";
import train from "../../models/train.babylon.json";
import terrain from "../../models/terrain.babylon.json";
import terrain2 from "../../models/terrain2.babylon.json";

@injectable()
export class Scene {
    camera: Camera;
    terrain: Mesh;
    torus: Mesh;
    staticLight: Light;
    reflector: Reflector;

    constructor() {
        this.initCamera();
        this.initMeshes();
        this.initLights();
    }

    private initCamera() {
        this.camera = new Camera();
        this.camera.position = new Vector3(0, 12, 10);
        this.camera.target = Vector3.ZERO;
    }

    private initMeshes() {
        this.terrain = Mesh.fromBabylon(terrain)[0];
        this.torus = Mesh.fromBabylon(torus)[0];
        this.torus.position.y = 5;
    }

    private initLights() {
        this.staticLight = {
            position: new Vector3(0, 10, 0)
        };

        this.reflector = {
            position: new Vector3(-2, 10, 3),
            target: new Vector3(-2, 0, 0)
        };
    }

    getMeshes(): Mesh[] {
        return [
            this.terrain,
            this.torus
        ];
    }

    getLights(): Light[] {
        return [
            // this.staticLight,
            this.reflector
        ];
    }
}
