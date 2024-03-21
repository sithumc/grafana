import 'systemjs/dist/system';
import 'systemjs/dist/extras/named-register';
// Add ability to load plugins bundled as AMD format
import 'systemjs/dist/extras/amd';
// Add ability to load plugins bundled as CJS format
import 'systemjs-cjs-extra';

export const SystemJS = window.System;
