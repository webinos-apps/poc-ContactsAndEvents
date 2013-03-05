app-contacts 
============

CONTACTS CHAT APP
=================

Contacts Description:
----------------------
Currently, lists the contacts from the selected source and provides the opportunity to search them.
There is an option to tweet to the selected contact.

Future option, include listing contacts from multiple sources, and displaying the contacts on the map.

Also, opportunity to manage contacts will be provided, when the following functions will be implemented in contacts API.

Instructions how to run the app:

1)copy files from app-contacts repository, so you get the following structure <directory with you Webinos-Platform>\Webinos-Platform\webinos\web_root\apps\app-contacts\

2)open in browser link - https://pzh.webinos.org/main.html, and login with you gmail account.

3)Run pzp in command line: <directory with you Webinos-Platform>\Webinos-Platform > node webinos_pzp

5)Go to http://localhost:8080/apps/app-contacts/contacts.html

6)Press the Settings

8)Enter the pass to thunderbird file for local authentication or login and password for gmail account.

9)Press Save Settings button.

9)Press Authenticae\Open button.

10)Press Go to Main Page or Go to Search Menu button to see all list of contacts or to find a contact.

11)Press a link to open a detailed page, associated with the contact.

12)You can tweet to the contact's nickname from your tweeter account using input box and button Tweet
 on the contact's Detailed information page

Chat App:
=========

Features:
---------
1)When Clicked on the Chat Icon It shows the Chat User Screen that you have Entered with your Credentials to retrieve your Contacts
  Then shows the Online Contacts if any and can Invite for the Chat.
   
2)Once the Invitation is accepted from the Users. If the User doesn't want to accept the Invite, User can select the cancel button.

3)The Chat Module opens the ChatBox Screen which includes the settings of the Chat that the Users can change.

4)The Components of the Chat Module are Chat Screen, Chat Box, Chat Text, Chat Button, Chat Input.

5)There is a Text Button which highlights when the Chat Box is hidden.

6)On the top of the Chat Screen next to the Chat Settings Panel an Exit Button is placed.

Settings Panel:
---------------

7)The function set settings holds all the Chat Settings functionality. This function is invoked then the settings button would be shown in the Chat Screen

The Setting Panel include:

There are Settings for both the Users, The one who is chatting can as well change the font, size, Color and style of the User with whom he/she is chatting with only on his own Screen.

* Font Color: Select opteions from black, red, green, blue
* Sytle: sans-serif, AmadeusRegular, SpecialEliteRegular, ScratchmybackRegular
* Font Size: 100%, 120%, 150%
* Status: whether the User is Available or Invisible.
