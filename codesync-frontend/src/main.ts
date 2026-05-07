import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

(window as any).global = window;
(window as any).process = { env: { DEBUG: undefined } };

(window as any).MonacoEnvironment = {
  getWorkerUrl: function () {
    return `assets/monaco/base/worker/workerMain.js`;
  }
};

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
