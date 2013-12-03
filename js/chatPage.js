var eventsServiceType = "http://webinos.org/api/events";
// Wait for document to load
$(document).ready(function () {

    // We will be keeping the services found on these variables
    var eventAPIToUse;

    // Repeat the same code to bind to the event service. We could actually avoid this but htis is a POC
    var bindEventsService = function (service) {

        service.bindService({
            onBind: function () {
                eventAPIToUse = service;
                $("#cmdPickEventApi").addClass("bound");
                // TODO: add the code from the chat.js file
                // line 257
            }
        });
    };

    // Use the find service and filter the results using the input of the 
    // dashboard
    var findEventsService = function (serviceFilters) {
        webinos.discovery.findServices(new ServiceType(serviceFilters.api), {
            onFound: function (service) {
                if (service.id == serviceFilters.id) {
                    bindEventsService(service);
                }
            }
        }, {}, { zoneId: [serviceFilters.address] }); // Filter zone for the specific device
    };


    $("#cmdPickEventApi").bind('click', function () {
        webinos.dashboard.open({
            module: 'explorer',
            data: {
                service: eventsServiceType
            }
        }).onAction(function (data) {
            // If user selected anything
            if (data.result.length == 1) {
                var serviceFilters = data.result[0];
                // Store the service to rebind later on
                localStorage["eventsService"] = JSON.stringify(serviceFilters);
                findEventsService(serviceFilters);
            }
        });
    });

    //  When we start let's try to rebind the stored services
    if (localStorage["eventsService"]) { // If we have something stored
        try {
            var savedService = JSON.parse(localStorage["eventsService"]);
            findEventsService(savedService);
        } catch (e) {
            // Empty problematic object
            localStorage["eventsService"] = "";
        }
    }

});

