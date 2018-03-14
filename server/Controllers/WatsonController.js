'use strict';

import Promise from 'bluebird';
import DiscoveryV1 from 'watson-developer-cloud/discovery/v1';
import jsonfile from 'write-json-file';
import async from 'async';
import {exec} from 'child_process';
import Queue from 'better-queue';
import fs from 'fs';
import archiver from 'archiver';
import genUid from 'uid';

class WatsonController {
    constructor() {
        this.username;
        this.password;
        this.environmentId;
        this.configurationId;
        this.discovery;
        this.collectionId;

        
    }

    init(){
        return new Promise((resolve, reject) => {
            this.username = process.env.WATSON_DISCOVERY_USERNAME;
            this.password = process.env.WATSON_DISCOVERY_PASSWORD;
            this.environmentId = process.env.WATSON_DISCOVERY_ENVID;
            this.configurationId = process.env.WATSON_DISCOVERY_CONFIGID;
            this.discovery = new DiscoveryV1({
                username: this.username,
                password: this.password,
                version_date: '2017-11-07'
            });
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
            resolve();
        });
    }

    /**
     * Get CollectionId : String
     */
    async getCollection() {
        await this.init();
        return new Promise(async (resolve, reject) => {
            if (this.collectionId){
                resolve();
            }
            else { //create a collection 
                let options = {
                    environment_id: this.environmentId,
                    name: 'New Collection',
                    languagecode: 'pt-br',
                    configuration_id: this.configurationId
                };
                
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
                    });
            }
        });
    }

    /**
     * Delete current collection
     */
    async deleteCollection(bodyCollectionId) {
        await this.init();
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
                        console.log('WATSON Log: ' + options.collection_id +  ' collection Deleted');
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

    async _curlAddDocument(filePath) {
        await this.init();
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

    async uploadFiles(docs) {
        await this.init();
        return new Promise((resolve, reject) => {
            this.getCollection()
                .then(async () => {

                    //create a Uploader Queue
                    let uploaderQueue = await new Queue((doc, cb) =>{
                        this._curlAddDocument(doc)
                            .then(cb())
                            .catch((err) => cb(err));
                        
                    }, { afterProcessDelay: 100 });

                    // Upload all files to Discovery
                    async.forEach(docs, (doc, cb) => {
                        let numberUid = genUid(10);
                        jsonfile(`/tmp/entry/${numberUid}.json`, doc)
                            .then(() => {
                                uploaderQueue.push(`/tmp/entry/${numberUid}.json`);
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
    async searchText(countMax=2000) {
        await this.init();
        return new Promise(async (resolve, reject) => {
            this.getCollection()
                .then(() => {
                    console.log('TO DENRTO');
                    const params = {
                        environment_id: this.environmentId,
                        collection_id: this.collectionId,
                        natural_language_query: 'notebook',
                        count: countMax,
                    }
        
                    this.discovery.query(params)
                        .then((data) => {
                            console.log(data);
                            let result = JSON.stringify(data);
                            result = JSON.parse(result);   
                            resolve(result);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
}

export default new WatsonController();
