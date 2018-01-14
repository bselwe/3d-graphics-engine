import { EventEmitter } from "eventemitter3";
import { Container, decorate, injectable } from "inversify";

import { Application } from "./Application";
import { Renderer } from "./Engine/Renderer";

decorate(injectable(), EventEmitter);

const container = new Container();

container.bind<Application>(Application).toSelf().inSingletonScope();
container.bind<Renderer>(Renderer).toSelf();

export { container };