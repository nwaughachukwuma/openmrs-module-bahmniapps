'use strict';

angular.module('bahmni.common.offline')
    .service('offlineDbService', ['$http', '$q', 'patientDbService', 'patientAddressDbService', 'patientAttributeDbService', 'offlineMarkerDbService', 'offlineAddressHierarchyDbService',
        'offlineConfigDbService', 'initializeOfflineSchema', 'referenceDataDbService', 'locationDbService', 'offlineSearchDbService', 'encounterDbService', 'visitDbService', 'observationDbService', 'conceptDbService','errorLogDbService', 'eventLogService',
        function ($http, $q, patientDbService, patientAddressDbService, patientAttributeDbService, offlineMarkerDbService, offlineAddressHierarchyDbService,
                  offlineConfigDbService, initializeOfflineSchema, referenceDataDbService, locationDbService, offlineSearchDbService, encounterDbService, visitDbService, observationDbService, conceptDbService, errorLogDbService, eventLogService) {
        var db;


        var createPatient = function (postRequest) {
            var deferred = $q.defer();
            var uuid = postRequest.patient.uuid;
            insertPatientData(postRequest)
                .then(function () {
                    getPatientByUuid(uuid).then(function (result) {
                        deferred.resolve({data: result});
                    })
                });
            return deferred.promise;
        };

        var getPatientByUuid = function (uuid) {
            return patientDbService.getPatientByUuid(db, uuid);
        };

        var deletePatientData = function (uuid) {
            var deferred = $q.defer();
            var queries = [];

            var patientTable = db.getSchema().table('patient');
            var patientAddress = db.getSchema().table('patient_address');
            var patientAttributes = db.getSchema().table('patient_attribute');


            queries.push(db.delete().from(patientAttributes).where(patientAttributes.patientUuid.eq(uuid)));
            queries.push(db.delete().from(patientAddress).where(patientAddress.patientUuid.eq(uuid)));
            queries.push(db.delete().from(patientTable).where(patientTable.uuid.eq(uuid)));

            var tx = db.createTransaction();
            tx.exec(queries);
            deferred.resolve({});
            return deferred.promise;
        };

        var insertPatientData = function (patientData) {
            var patient = patientData.patient;
            var person = patient.person;

            return patientDbService.insertPatientData(db, patientData).then(function (patientUuid) {
                patientAttributeDbService.insertAttributes(db, patientUuid, person.attributes);
                patientAddressDbService.insertAddress(db, patientUuid, person.addresses[0]);
                return patientData;
            });

        };


         var createEncounter = function (encounterData) {
                var deferred = $q.defer();
                insertEncounterData(encounterData).then(function () {
                    if(encounterData.visitUuid){
                        eventLogService.getDataForUrl(Bahmni.Common.Constants.visitUrl + "/" + encounterData.visitUuid).then(function(response) {
                            insertVisitData(response.data).then(function() {
                                deferred.resolve({data: encounterData});
                            });
                        },function (error) {
                            deferred.resolve({data: encounterData});
                        });
                    }else{
                        deferred.resolve({data: encounterData});
                    }
                });
                return deferred.promise;
            };

            var insertEncounterData = function (encounterData) {
                return encounterDbService.insertEncounterData(db, encounterData).then(function () {
                    if(encounterData && encounterData.observations && encounterData.observations.length > 0){
                        return observationDbService.insertObservationsData(db, encounterData.patientUuid, encounterData.visitUuid, encounterData.observations).then(function () {
                            return encounterData;
                        });
                    }
                    return encounterData;
                });
            };

            var getEncountersByPatientUuid = function (patientUuid) {
                return encounterDbService.getEncountersByPatientUuid(db, patientUuid)
            };


        var getActiveEncounter = function(params){
            var deferred = $q.defer();
            getReferenceData("encounterSessionDuration").then(function(encounterSessionDurationData){
                var encounterSessionDuration = encounterSessionDurationData.data;
                getReferenceData("DefaultEncounterType").then(function(defaultEncounterType) {
                    var encounterType = defaultEncounterType ? defaultEncounterType.data : null;
                    encounterDbService.findActiveEncounter(db, {patientUuid: params.patientUuid, providerUuid: params.providerUuids[0], encounterType: encounterType}, encounterSessionDuration).then(function (encounter) {
                        deferred.resolve(encounter);
                    });
                });

            });
            return deferred.promise;
        };
            
        var init = function (offlineDb) {
            db = offlineDb;
            offlineMarkerDbService.init(offlineDb);
            offlineAddressHierarchyDbService.init(offlineDb);
            offlineConfigDbService.init(offlineDb);
            referenceDataDbService.init(offlineDb);
            offlineSearchDbService.init(offlineDb);
            conceptDbService.init(offlineDb);
        };

        var initSchema = function () {
            return initializeOfflineSchema.initSchema();
        };

        var reinitSchema = function () {
            return initializeOfflineSchema.reinitSchema();
        };

        var getMarker = function (markerName) {
            return offlineMarkerDbService.getMarker(markerName);
        };

        var insertMarker = function (markerName, eventUuid, catchmentNumber) {
            return offlineMarkerDbService.insertMarker(markerName, eventUuid, catchmentNumber);
        };

        var insertAddressHierarchy = function (data) {
            return offlineAddressHierarchyDbService.insertAddressHierarchy(data)
        };

        var searchAddress = function(params){
            return offlineAddressHierarchyDbService.search(params);
        };

        var getConfig = function(module){
            return offlineConfigDbService.getConfig(module);
        };

        var insertConfig = function(module, data, eTag){
            return offlineConfigDbService.insertConfig(module, data, eTag);
        };

        var getReferenceData = function(referenceDataKey){
            return referenceDataDbService.getReferenceData(referenceDataKey);

        };

        var insertReferenceData = function(key, data, eTag){
            return referenceDataDbService.insertReferenceData(key, data, eTag);
        };

        var getLocationByUuid = function(uuid){
            return locationDbService.getLocationByUuid(db, uuid);
        };

        var getAttributeTypes = function(){
            return patientAttributeDbService.getAttributeTypes(db);
        };

        var getConcept = function (conceptUuid) {
            return conceptDbService.getReferenceData(conceptUuid);
        };

        var getConceptByName = function (conceptUuid) {
            return conceptDbService.getConceptByName(conceptUuid);
        };

        var insertConceptAndUpdateHierarchy = function (data, parent) {
            return conceptDbService.insertConceptAndUpdateHierarchy(data, parent);
        };

        var updateChildren = function (concept) {
            return conceptDbService.updateChildren(concept);
        };

        var updateParentJson = function (child) {
            return conceptDbService.updateParentJson(child);
        };
        
        var insertVisitData = function (visitData) {
            return visitDbService.insertVisitData(db, visitData);
        };

        var getVisitByUuid = function (visitUuid) {
            return visitDbService.getVisitByUuid(db, visitUuid);
        };

        var getEncounterByEncounterUuid = function(encounterUuid){
            return encounterDbService.getEncounterByEncounterUuid(db,encounterUuid);
        };

        var getObservationsFor = function (params) {
            return observationDbService.getObservationsFor(db, params);
        };

        var getVisitsByPatientUuid = function (patientUuid, numberOfVisits) {
            return visitDbService.getVisitsByPatientUuid(db, patientUuid, numberOfVisits);
        };

        var insertLog = function (failedRequest, responseStatus, stackTrace) {
            return errorLogDbService.insertLog(db, failedRequest, responseStatus, stackTrace);
        };


        var getAllParentsInHierarchy = function(conceptName){
            var conceptNamesInHierarchy = [];
            return conceptDbService.getAllParentsInHierarchy(conceptName, conceptNamesInHierarchy)
        };

        var getPrescribedAndActiveDrugOrders = function (params) {
            return encounterDbService.getEncountersByVisits(db, params);
        };

        return {
            init: init,
            initSchema: initSchema,
            reinitSchema: reinitSchema,
            getPatientByUuid: getPatientByUuid,
            createPatient: createPatient,
            deletePatientData: deletePatientData,
            getMarker: getMarker,
            insertMarker: insertMarker,
            insertAddressHierarchy: insertAddressHierarchy,
            searchAddress: searchAddress,
            getConfig : getConfig,
            insertConfig : insertConfig,
            getReferenceData: getReferenceData,
            insertReferenceData: insertReferenceData,
            getLocationByUuid: getLocationByUuid,
            getAttributeTypes : getAttributeTypes,
            insertEncounterData: insertEncounterData,
            getEncountersByPatientUuid: getEncountersByPatientUuid,
            createEncounter: createEncounter,
            insertVisitData: insertVisitData,
            getVisitByUuid: getVisitByUuid,
            getActiveEncounter: getActiveEncounter,
            getEncounterByEncounterUuid: getEncounterByEncounterUuid,
            getObservationsFor: getObservationsFor,
            getVisitsByPatientUuid: getVisitsByPatientUuid,
            insertConceptAndUpdateHierarchy: insertConceptAndUpdateHierarchy,
            getConcept: getConcept,
            getConceptByName: getConceptByName,
            updateChildren: updateChildren,
            updateParentJson: updateParentJson,
            getAllParentsInHierarchy: getAllParentsInHierarchy,
            insertLog: insertLog,
            getPrescribedAndActiveDrugOrders: getPrescribedAndActiveDrugOrders
        }
    }]);