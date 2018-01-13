import { Vector3 } from "../Models/Vector3";
import { matrix, multiply, inv, sin, cos } from "mathjs";

export class Transformations {
    static scale(xScale: number = 1, yScale: number = 1, zScale: number = 1): mathjs.Matrix {
        return matrix([
            [xScale, 0, 0, 0],
            [0, yScale, 0, 0],
            [0, 0, zScale, 0],
            [0, 0, 0, 1],
        ]);
    }

    static translate(xTranslation: number, yTranslation: number, zTranslation: number): mathjs.Matrix {
        return matrix([
            [1, 0, 0, xTranslation],
            [0, 1, 0, yTranslation],
            [0, 0, 1, zTranslation],
            [0, 0, 0, 1]
        ]);
    }

    static rotate(xAngle: number, yAngle: number, zAngle: number): mathjs.Matrix {
        let xRotation = matrix([
            [1, 0, 0, 0],
            [0, cos(xAngle), -sin(xAngle), 0],
            [0, sin(xAngle), cos(xAngle), 0],
            [0, 0, 0, 1]
        ]);

        let yRotation = matrix([
            [cos(yAngle), 0, sin(yAngle), 0],
            [0, 1, 0, 0],
            [-sin(yAngle), 0, cos(yAngle), 0],
            [0, 0, 0, 1]
        ]);

        let zRotation = matrix([
            [cos(zAngle), -sin(zAngle), 0, 0],
            [sin(zAngle), cos(zAngle), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]);

        return multiply(zRotation, multiply(yRotation, xRotation));

        // return matrix([
        //     [cos(xAngle) * cos(yAngle), cos(xAngle) * sin(yAngle) * sin(zAngle) - sin(xAngle) * cos(zAngle), cos(xAngle) * sin(yAngle) * cos(zAngle) + sin(xAngle) * sin(zAngle), 0],
        //     [sin(xAngle) * cos(yAngle), sin(xAngle) * sin(yAngle) * sin(zAngle) + cos(xAngle) * cos(zAngle), sin(xAngle) * sin(yAngle) * cos(zAngle) - cos(xAngle) * sin(zAngle), 0],
        //     [-sin(yAngle), cos(yAngle) * sin(zAngle), cos(yAngle) * cos(zAngle), 0],
        //     [0, 0, 0, 1]
        // ]);
    }

    static lookAt(cameraPosition: Vector3, cameraTarget: Vector3, upVector: Vector3): mathjs.Matrix {
        let upVersor = upVector.normalize();
        let zAxis = Vector3.difference(cameraPosition, cameraTarget).normalize();
        let xAxis = Vector3.cross(upVersor, zAxis).normalize();
        let yAxis = Vector3.cross(zAxis, xAxis).normalize();

        let viewMatrixInversed = matrix([
            [xAxis.x, yAxis.x, zAxis.x, cameraPosition.x],
            [xAxis.y, yAxis.y, zAxis.y, cameraPosition.y],
            [xAxis.z, yAxis.z, zAxis.z, cameraPosition.z],
            [0, 0, 0, 1]
        ]);

        return inv(viewMatrixInversed) as mathjs.Matrix;
    }

    static perspective(): mathjs.Matrix {
        return matrix([
            [2.414, 0, 0, 0],
            [0, 2.414, 0, 0],
            [0, 0, -1.02, -2.02],
            [0, 0, -1, 0]
        ]);
    }
}
