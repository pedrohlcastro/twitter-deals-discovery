'use strict';

import DiscoveryV1 from 'watson-developer-cloud/discovery/v1';

class WatsonController {
    constructor() {
        this.envId = '090520cc-e437-4d4e-9d58-c5b8be725f60';
        this.configId = '860098b0-5b72-4e87-bd8a-1f6f977d9760';
        this.discovery = new DiscoveryV1({
            username: '212a41ed-8119-492a-acd4-031a79660662',
            password: 'Z3QpSxT3n5b8',
            version_date: '2017-11-07'
        });
    }

    uploadDocs() {

    }
}

export default new WatsonController();
