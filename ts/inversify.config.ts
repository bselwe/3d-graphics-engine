import { EventEmitter } from "eventemitter3";
import { Container, decorate, injectable } from "inversify";

import { Application } from "./Application";
import { Renderer } from "./Engine/Renderer";
import { Panel } from "./Panel";
import { Scene } from "./Engine/Scene";

decorate(injectable(), EventEmitter);

const container = new Container();

container.bind<Application>(Application).toSelf().inSingletonScope();
container.bind<Renderer>(Renderer).toSelf();
container.bind<Panel>(Panel).toSelf().inSingletonScope();
container.bind<Scene>(Scene).toSelf().inSingletonScope();

export { container };
