import { EventEmitter } from "eventemitter3";
import { Container, decorate, injectable } from "inversify";

import { Application } from "./Application";

decorate(injectable(), EventEmitter);

const container = new Container();

container.bind<Application>(Application).toSelf().inSingletonScope();

export { container };
