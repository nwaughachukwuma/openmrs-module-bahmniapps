'use strict';

describe("EncounterTransactionMapper", function () {

    describe("map", function () {
        var mapper;

        beforeEach(function () {
            mapper = new Bahmni.Clinical.EncounterTransactionMapper();
        });

        it('should set default visit type in encounter when there is no active visit', function () {
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], visitUuid: null };
            var patient = { uuid:"patientUuid"};
            
            var encounterData = mapper.map(consulation, patient, null, {}, null, defaultVisitType, false);

            expect(encounterData.visitType).toBe(defaultVisitType);
            expect(encounterData.providers).toEqual([{uuid: "provider-uuid"}]);
        });

        it('should not update encounterData with logged in location uuid in editEncounter mode', function(){
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {}, null, defaultVisitType, true);

            expect(encounterData.locationUuid).toBe("original-location-uuid");

        });

        it('should update encounterData with logged in location uuid when not in editEncounter mode', function(){
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {}, null, defaultVisitType, false);

            expect(encounterData.locationUuid).toBe("logged-in-location-uuid");

        });

        it('should update encounterData with default visit type if visit uuid is not set and not in retrospective mode either', function(){
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {}, null, defaultVisitType, false);

            expect(encounterData.visitType).toBe("OPD");

        });

        it('should update encounterData with default retrospective visit type if it is in retrospective mode either', function(){
            var obs = {uuid: "obsUuid"};
            var defaultRetrospectiveVisitType = "IPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {encounterDate : "2015-04-01"}, defaultRetrospectiveVisitType, null, false);

            expect(encounterData.visitType).toBe("IPD");

        });

        it('should set program enrollment uuid as patient program uuid', function(){
            var obs = {uuid: "obsUuid"};
            var defaultRetrospectiveVisitType = "IPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};
            var patientProgramUuid = "someNiceUuid";

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {encounterDate : "2015-04-01"}, defaultRetrospectiveVisitType, null, false, patientProgramUuid);

            expect(encounterData.context.patientProgramUuid).toBe(patientProgramUuid);

        });
    });
});

