import { ViewSet } from "../shared/viewset.js";

export class PublicViewSet extends ViewSet {
  get routes() {
    return {
      public: {
        "GET /": this.homepage,
      },
    };
  }

  homepage() {
    return this.html({
      status: 200,
      template: "homepage",
    });
  }
}
