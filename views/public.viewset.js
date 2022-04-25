import { ViewSet } from '../shared/viewset.js';

export class PublicViewSet extends ViewSet {
  routes = {
    'GET /': this.homepage,
  };

  homepage() {
    return this.html({ template: 'homepage' });
  }
}
