# JustDoIt App - fitness tracker app for runners and cyclists. 

## Description
Would you like to see where you ran last week on the map? Or how long have you been cycling last Sunday? Or maybe you want to see what your longest run was all this time. It is possible with the JustDoIt App!<br>
To have a good experience with the app, it is possible to enter the type of activity, distance, duration, and cadence/elevation. Any time user can edit this data, if activity has changed. If a user decides to have a fresh start, it's possible to delete *all activity*, both from the map and from the sidebar. The form in the app has validation, so the user will be aware if something goes wrong with the data. The app lets user see all activities on the map using *Show all* button. A nice feature of the app is that the data located in localStorage, so if user will close the browser by accident, the data will be still there. 

## Demo

![Demo](https://github.com/wartelski/JustDoIt-App/blob/main/JustDoItDemoP1.gif)

![Demo](https://github.com/wartelski/JustDoIt-App/blob/main/JustDoItDemoP2.gif)

## Mobile/Tablet Support
JustDoIt is a *responsive app* that is possible to view using a browser on different devices, such as mobile or tablet.
<br>
![Tablet](https://github.com/wartelski/JustDoIt-App/blob/main/TabletSize.png)
![Mobile](https://github.com/wartelski/JustDoIt-App/blob/main/PhoneSize.png)

## Installation

``` git clone https://github.com/wartelski/JustDoIt-App.git ```

## Tech Stack

**Client:** JavaScript, CSS, HTML <br>
* To create an interactive map, I used [Leaflet.js](https://leafletjs.com/) library. This light-weight, open-source and mobile-freindly mapping library did the trick and brought a real joy of building the app. 
* Used modern, up-to-date JavaScript (ES6+)
* Used localStorage to store the data
* The app uses the [Navigator.geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/geolocation) feature to access the location of the device.

## Flowchart
![flowchart](https://github.com/wartelski/JustDoIt-App/blob/main/flowchart.png)

## Quality Tests
As the app is fairly simple and can be upgraded to more functional project, I didn't add any tests for now. <br>
But if to do so, I would do it using [TestRigor](https://testrigor.com/)

## Credits
I'm glad to say that all this hard work couldn't be possible without an amazing course by [Jonas Schmedtmann](https://twitter.com/jonasschmedtman), who puts a lot of effort to teach his students and give a high quality knowledge of programming.  
## License

[MIT](https://github.com/wartelski/JustDoIt-App/blob/main/LICENSE) 
<br>
*The app was created only for learning purposes*
