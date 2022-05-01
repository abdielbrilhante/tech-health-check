import { View } from '../shared/view.js';

export const homepage = new View()
  .get('/')
  .handler(() => View.html({ template: 'homepage' }));
