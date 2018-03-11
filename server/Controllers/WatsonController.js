'use strict';

import Promise from 'bluebird';
import DiscoveryV1 from 'watson-developer-cloud/discovery/v1';
import jsonfile from 'write-json-file';
import async from 'async';
import {exec} from 'child_process';
import Queue from 'better-queue';
import fs from 'fs';

class WatsonController {
    constructor() {
        this.username = '212a41ed-8119-492a-acd4-031a79660662';
        this.password = 'Z3QpSxT3n5b8';
        this.environmentId = '9b9316e2-adf8-4718-bbd1-5ca0752d0f77';
        this.configurationId = '860098b0-5b72-4e87-bd8a-1f6f977d9760';
        this.discovery = new DiscoveryV1({
            username: this.username,
            password: this.password,
            version_date: '2017-11-07'
        });

        this.collectionId;


        //promisify sdk
        this.discovery.getEnvironments = Promise.promisify(this.discovery.getEnvironments);
        this.discovery.getCollection = Promise.promisify(this.discovery.getCollection);
        this.discovery.deleteCollection = Promise.promisify(this.discovery.deleteCollection);
        this.discovery.createEnvironment = Promise.promisify(this.discovery.createEnvironment);
        this.discovery.getConfigurations = Promise.promisify(this.discovery.getConfigurations);
        this.discovery.createCollection = Promise.promisify(this.discovery.createCollection);
        this.discovery.addDocument = Promise.promisify(this.discovery.addDocument);
        this.discovery.query = Promise.promisify(this.discovery.query);
        this.discovery.getCollections = Promise.promisify(this.discovery.getCollections);
        this.execPromise = Promise.promisify(exec);
    }

    /**
     * Get CollectionId : String
     */
    getCollection() {
        if (this.collectionId){
            return;
        }
        else { //create a collection 
            let options = {
                environment_id: this.environmentId,
                name: 'New Collection',
                languagecode: 'pt-br',
                configuration_id: this.configurationId
            };
            return new Promise(async (resolve, reject) => {
                this.discovery.getCollections({environment_id: this.environmentId})
                    .then((data) => {
                        console.log(data);
                        if (data.collections[0]){
                            this.collectionId = data.collections[0].collection_id;
                            resolve();
                        } else {
                            this.discovery.createCollection(options)
                                .then((data) => {
                                    // console.log(data);
                                    this.collectionId = data.collection_id;
                                    console.log(this.collectionId);
                                    resolve();
                                })
                                .catch((err) => {
                                    console.log('WATSON [GetCollection] Error: ' + err);
                                    reject(err);
                                });
                        }
                    })
                    .catch((err) => {
                        console.log('WATSON [GetCollection] Error: ' + err);
                        reject(err);
                    })
            }); 
        }
    }

    /**
     * Delete current collection
     */
    deleteCollection(bodyCollectionId) {
        let idToBeDeleted = this.collectionId || bodyCollectionId;
        return new Promise((resolve, reject) => {
            if(idToBeDeleted && this.environmentId){
                let options = {
                    environment_id: this.environmentId,
                    collection_id: idToBeDeleted
                };
                this.discovery.deleteCollection(options, (err, data) => {
                    if (err){
                        console.log('WATSON [DeleteCollection] Error: ' + err);
                        reject(err);
                    }
                    if (data.status == 'deleted'){
                        this.collectionId = null;
                        console.log('WATSON Log: ' + options.collectionid +  ' collection Deleted');
                        resolve();
                    }
                    else{
                        if (err) console.log('WATSON [DeleteCollection] Error: Not deleted');
                        reject(new Error('WATSON [DeleteCollection] Error: Not deleted'));                  
                    }
                });
            } else {
                console.log('WATSON [DeleteCollection] Error: collectionid not found');
                reject(new Error('WATSON [DeleteCollection] Error: collectionid not found'));
            }
        });
    }

    _curlAddDocument(filePath) {
        return new Promise((resolve, reject) => {
            let curlCmd = `curl -X POST -u "${this.username}":"${this.password}" -F file=@${filePath} `
            let execString = `${curlCmd} "https://gateway.watsonplatform.net/discovery/api/v1/environments/${this.environmentId}/collections/${this.collectionId}/documents?version=2017-11-07"`;
            this.execPromise(execString)
                .then((data) => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    uploadFiles(docs) {
        return new Promise((resolve, reject) => {
            this.getCollection()
                .then(async () => {

                    //create a Uploader Queue
                    let uploaderQueue = await new Queue((doc, cb) =>{
                        this._curlAddDocument(doc)
                            .then(cb())
                            .catch((err) => cb(err));
                        
                    }, { afterProcessDelay: 100});

                    // Upload all files to Discovery
                    async.forEach(docs, (doc, cb) => {
                        jsonfile(`/tmp/${doc.link}.json`, doc)
                            .then(() => {
                                uploaderQueue.push(`/tmp/${doc.link}.json`);
                                cb();
                            })
                            .catch((err) => {
                                if(err){
                                    cb(err);
                                }
                            });
                    }, (err) => {
                        uploaderQueue.on('drain', (err) => {
                            if (err){
                                console.log('Watson [addDocument] error: ' + err);
                                reject(new Error('Watson [addDocument] error: ' + err));
                            } else {
                                console.log('Watson Log: All files uploded...');
                                resolve();
                            }
                        });
                    });
                })
                .catch((err) => {
                    reject({status: 500, msg: 'WATSON [GetCollection] Error', err: err});
                });
        });
    }

    /**
     * Search based on a raw text
     * @param {string} entityType 
     */
    searchText(productType='MARCA', countMax=2000) {
        return new Promise(async (resolve, reject) => {
            // const params = {
            //     environment_id: this.environmentId,
            //     collection_id: this.collectionId,
            //     query_string: `enriched_text.entities.type::"MARCA"`,
            //     count: countMax,
            //     filter: `enriched_text.entities.type::"MARCA"`
            // }

            // this.discovery.query(params)
            //     .then((data) => {
            //         let result = JSON.stringify(data);
            //         result = JSON.parse(result);   
            //         resolve(result);
            //     })
            //     .catch((err) => {
            //         reject(err);
            //     });
        });
    }
}

export default new WatsonController();
