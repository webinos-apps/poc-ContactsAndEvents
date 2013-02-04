$(document).ready(function() {
	/*$('#cnt_remote').bind('click', function() {
		console.log('Remote methode');
		$('#remoteAuth ').show();
		$('#localAuth').hide();

	});

	$('#cnt_local').bind('click', function() {
		console.log('Local methode');
		$('#localAuth').show();
		$('#remoteAuth ').hide();
	});*/
	
	 $('#btnSaveSettings').bind('click', function() {
		 	console.log("button clicked", storer);
		 	storer.saveEditSetting();
	  });
	 
	 $('#btnAuthenticate').bind('click', function() {
		 storer.getSettings(function(data) {
				
				console.log("Settings!!!! ", data);
				contacManager.permissions = data;

				contacManager.getContacts(printContactNames);
				console.log("contacManager.contactService",
						contacManager.contactService);

			}, function(err) {

				$("#contactList").text("No settings found!");
				$('#noSettingsMessage').show();
				console.log("Error:  " + err);
			});
			     
	});
	 
	 storer.getSettings(function (data) {
		 		console.log("Settings!!!! ", data);
				$("#usernameText").val(data.usr);
				$("#passwordText").val(data.pwd);
			 
		//  $("input[@name='contactType']:checked").trigger('click');
	     
	        
	    }, function (err) {
	    	
	         $("#contactList").text("No settings found!");
	        console.log("Error:  " + err);
	    });   
	
});