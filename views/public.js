import { ViewSet } from "../shared/viewset.js";

export class PublicViewSet extends ViewSet {
  get routes() {
    return {
      'GET /index.html': this.homepage
    }
  }

  // GET /
  homepage() {
    return this.html({
      status: 200,
      template: 'homepage',
      context: {
        firstName: 'Abdiel',
        lastName: 'Soares',
      }
    });
  }
}
