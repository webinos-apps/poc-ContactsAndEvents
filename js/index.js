// This is the contacts API service type
var contactServiceType = "http://webinos.org/api/contacts";

// Wait for document to load
$(document).ready(function () {
   

    // We will be keeping the services found on these variables
    var contactsService;

    var bindContactsService = function (service) {
        service.bindService({
            onBind: function () {
                contactsService = service;
                $("#cmdPickContactsApi").addClass("bound");
            }
        });
    };

    // Use the find service and filter the results using the input of the 
    // dashboard
    var findContactService = function (serviceFilters) {
        webinos.discovery.findServices(new ServiceType(serviceFilters.api), {
            onFound: function (service) {
                if (service.id == serviceFilters.id) {
                    bindContactsService(service);
                }
            }
        }, {}, { zoneId: [serviceFilters.address] }); // Filter zone for the specific device
    };

    $("#cmdPickContactsApi").bind('click', function () {
        webinos.dashboard.open({
            module: 'explorer',
            data: {
                service: contactServiceType
            }
        }).onAction(function (data) {
            // If user selected anything
            if (data.result.length == 1) {
                var serviceFilters = data.result[0];
                // Store the service to rebind later on
                localStorage["contactService"] = JSON.stringify(serviceFilters);
                findContactService(serviceFilters);
            }
        });
    });

   
    //  When we start let's try to rebind the stored services
    if (localStorage["contactService"]) { // If we have something stored
        try {
            var savedService = JSON.parse(localStorage["contactService"]);
            findContactService(savedService);
        } catch (e) {
            // Empty problematic object
            localStorage["contactService"] = "";
        }
    }


    /* ------------------------------------  Contacts page -------------------------- */
    // Sync is not needed as the user can manually do that in the dashboard
    $("#cmdSyncContacts").bind("click", function() {
        if (contactsService != null) {
            // Try to sync all local services
            contactsService.syncThunderbirdContacts({});
            contactsService.syncOutlookContacts({});
        } else {
            alert("No contact service is bound!");
        }
    });


    var getSearchCriteria = function () {
        var searchCriteria = {
            fields: []
        };
        if ($('#findContactDisplayName').val() != "") {
            searchCriteria.fields["displayName"] = $('#findContactDisplayName').val().trim();
        }
        if ($('#findContactName').val() != "") {
            searchCriteria.fields["name"] = $('#findContactName').val().trim();
        }
        if ($('#findContactEmail').val() != "") {
            searchCriteria.fields["emails"] = $('#findContactEmail').val().trim();
        }
        if ($('#findContactAddress').val() != "") {
            searchCriteria.fields["addresses"] = $('#findContactAddress').val().trim();
        }
        if ($('#findContactPhone').val() != "") {
            searchCriteria.fields["phoneNumbers"] = $('#findContactPhone').val().trim();
        }
        return searchCriteria;
    };


    var getContactHtml = function (contact) {
            var contactString = " <b>Display Name: </b>";
            var displayName = '';
            if (isString(contact.displayName)) {
                displayName = (contact.displayName == "" ? "<b>Anonymous</b>" : contact.displayName);
            }
            contactString += displayName + "<br>";
            if (contact.nickname != undefined && contact.nickname != "") {
                contactString += "<b>Nickname: </b>" + contact.nickname + "<br>";
            } 
            // name
            contactString += (contact.name.formatted == "" ? "<b>Anonymous</b></br>" : "<b>Name: </b>" + contact.name.formatted + "<br>");

            if ((contact.emails instanceof Array) && contact.emails.length > 0) {
                contactString += "<b>Emails:</b><br>";
                for (var j = 0; j < contact.emails.length; j++)
                    contactString += "&nbsp;&nbsp;" + (contact.emails[j].pref ? "* " : "&nbsp;&nbsp;") + contact.emails[j].type + ": <a href=\"mailto:"
                        + contact.emails[j].value + "\">"
                        + contact.emails[j].value + "</a><br>";
            }
            if ((contact.addresses instanceof Array) && contact.addresses.length > 0) {
                contactString += "<b>Addresses:</b><br>";
                for (var j = 0; j < contact.addresses.length; j++)
                    contactString += "&nbsp;&nbsp;" + (contact.addresses[j].pref ? "* " : "&nbsp;&nbsp;")
                        + (contact.addresses[j].type == "" ? "other" : contact.addresses[j].type)
                        + ": " + contact.addresses[j].formatted
                        + "<br>";
            }
            if ((contact.phoneNumbers instanceof Array) && contact.phoneNumbers.length > 0) {
                contactString += "<b>Phones:</b><br>";
                for (var j = 0; j < contact.phoneNumbers.length; j++)
                    contactString += "&nbsp;&nbsp;" + (contact.phoneNumbers[j].pref ? "* " : "&nbsp;&nbsp;")
                        + contact.phoneNumbers[j].type + ": "
                        + contact.phoneNumbers[j].value
                        + "<br>";
            }
            if ((contact.ims instanceof Array) && contact.ims.length > 0) {
                contactString += "<b>Messengers:</b><br>";
                for (var j = 0; j < contact.ims.length; j++)
                    contactString += "&nbsp;&nbsp;" + (contact.ims[j].pref ? "* " : "&nbsp;&nbsp;")
                        + contact.ims[j].type + ": "
                        + contact.ims[j].value + "<br>";
            }
            if ((contact.organizations instanceof Array) && contact.organizations.length > 0) {
                contactString += "<b>Organizations:</b><br>";
                for (var j = 0; j < contact.organizations.length && contact.organizations[j].name != undefined; j++)
                    contactString += "&nbsp;&nbsp;" + (contact.organizations[j].pref ? "* " : "&nbsp;&nbsp;")
                        + contact.organizations[j].type + ": "
                        + contact.organizations[j].name
                        + "<br>";
            }
            if ((contact.photos instanceof Array) && contact.photos.length > 0) {
                contactString += "<b>Picture:</b><br>";
                for (var j = 0; j < contact.photos.length; j++) {
                    if (contact.photos[j].type == "file") // is
                        // base64
                        // string
                        contactString += "<img src=\"data:image/png;base64," + contact.photos[j].value + "\" alt=\"Image\"><br>";

                    else if (contact.photos[j].type == "url") { // is an URL
                        console.log("foto ", contact.photos[j]);
                        contactString += "<img src=\"" + contact.photos[j].value + "\" alt=\"Image\"><br>";
                        // TODO: quick and dirty solution for android
                        // issue. Photos arrays starts as array and get
                        // here as object
                    } else { 
                        var photo = contact.photos[j].value;
                        contactString += "<img alt=\"Image\" , src=\"data:image\/png;base64, " + photo + "\" /><br>";
                    }
                }
            }

            if ((contact.urls instanceof Array) && contact.urls.length > 0) {
                contactString += "<b>Websites:</b><br>";
                for (var j = 0; j < contact.urls.length; j++)
                    contactString += "&nbsp;&nbsp;" + (contact.urls[j].pref ? "* " : "&nbsp;&nbsp;")
                        + contact.urls[j].type + ": <a href=\""
                        + contact.urls[j].value + "\">"
                        + contact.urls[j].value + "</a><br>";
            }
            return contactString += "<br>";
    };

    $("#btnFindServiceContacts").bind('click', function () {
        if (contactsService != null) {
            $("#contactList").html("Searching...");
            var criteria = getSearchCriteria();
            // Search using the contacts API
            contactsService.find(criteria, function(data) {
                $("#contactList").html("");
                // Process results
                for (var i = 0; i < data.length; i++) {
                    var contact = data[i];
                    $("#contactList").append(getContactHtml(contact));
                }
            }, function(error) {
                $("#contactList").html(error.message);
            });
        } else {
            alert("No contact service is bound!");
        }
    });




});

