/**
 * Tree-shaking probe app: imports exactly one editor directive from the
 * *built* package (`dist/`, see tsconfig.probe.json) and is built with the
 * real Angular pipeline (linker + esbuild DCE). `scripts/bundle-probe.mjs`
 * asserts on the resulting stats.json that no heavy widget family made it
 * into the bundle.
 */
import { DxTextBoxValueDirective } from 'ngx-devextreme-zoneless';

console.log(DxTextBoxValueDirective);
