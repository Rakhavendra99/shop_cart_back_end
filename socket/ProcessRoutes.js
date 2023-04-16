'use strict';

import { MediaType } from '../config/Constants';

export default (router, routes) => {
    return routes.map(route => {
        switch (route.type) {
            case MediaType.GET:
                return router.get(route.path, route.method);
            case MediaType.POST:
                return router.post(route.path, route.method);
            case MediaType.PUT:
                return router.put(route.path, route.method);
            case MediaType.DELETE:
                return router.delete(route.path, route.method);
        }
    })
}