import { Component , NgZone} from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Storage } from '@ionic/storage';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  LatLng,
  CameraPosition,
  MarkerOptions,
  Marker,
  MyLocation
} from '@ionic-native/google-maps';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { HTTP } from '@ionic-native/http';
import { BackgroundMode } from '@ionic-native/background-mode';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public lat: any;
  public lng: any;
  public locations: any;
  public lastLocations: any;
  public iniPos: LatLng;
  public map: GoogleMap;


  constructor(public navCtrl: NavController, private backgroundGeolocation: BackgroundGeolocation,
              public zone: NgZone, public storage: Storage, private googleMaps: GoogleMaps, public platform: Platform,
              public notificator: LocalNotifications, private http: HTTP, private backgroundMode: BackgroundMode) {

    this.notificator.on('click',
        (not) => alert(not.id + " - " + not.data)
    );



    platform.ready().then(() => {

      this.backgroundMode.enable();
      this.startTracking();
      this.loadMap();

      this.notificator.hasPermission().then(
          (resp) => {if(!resp) alert("Ative as notificacoes!")}
      );







    });

    this.storage.ready().then(() => {
      // Or to get a key/value pair
      this.storage.get('locations').then((val) => {
        this.locations = val;
      })
    });

  }


  ionViewDidLoad() {
  }



  startTracking(){
    console.log('started tracking');
    const config: BackgroundGeolocationConfig = {
      desiredAccuracy: 0,
      stationaryRadius: 1,
      distanceFilter: 1,
      startOnBoot: true,
      interval: 300000,
      maxLocations: 500,
      notificationTitle: "Tá Fervendo",
      notificationText: "To te rastreando maluco",
      debug: true, //  enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: false, // enable this to clear background location settings when the app terminates
    };

    this.backgroundGeolocation.configure(config)
        .subscribe((location: BackgroundGeolocationResponse) => {

          console.log(location);
          let myLoc = new LatLng(location.latitude, location.longitude);

          this.searchPlaces(myLoc, true);

          // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
          // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
          // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
          this.backgroundGeolocation.finish(); // FOR IOS ONLY

        });

    // start recording location
    this.backgroundGeolocation.start();
  }

  addLastLocations(){
    // We iterate the array in the code
    let myPos = new LatLng(this.lastLocations[0].latitude, this.lastLocations[0].longitude);
    let position: CameraPosition = {
      target: myPos,
      zoom: 18,
      tilt: 30
    };

    this.map.moveCamera(myPos);
    let opt: MarkerOptions = {
      position: myPos,
      icon: "#ee0005"
    };
    this.map.addMarker(opt).then(
        (marker: Marker) => {

        }
    );

    for(let l of this.lastLocations){
      let pos = new LatLng(l.latitude, l.longitude);
      let opt: MarkerOptions = {
        position: pos,
        icon: "#b0e"
      };
      this.map.addMarker(opt).then(
          (marker: Marker) => {

          }
      );
    }
  }

  getLocations(){
    this.backgroundGeolocation.getLocations().then(
        (locations) => {
          this.lastLocations = locations ;
          this.addLastLocations();
        },
        (err) => {alert("erro getlocations");}
    );
  }



  stopTracking(){
    console.log('stopped tracking');
    // If you wish to turn OFF background-tracking, call the #stop method.
    this.backgroundGeolocation.stop();
  }

  getDistance(pos1, pos2){
      let lat1 = pos1.lat;
      let lon1 = pos1.lng;
      let lat2 = pos2.lat;
      let lon2 = pos2.lng;

      return this.getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2);
  }
  getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    let R = 6371; // Radius of the earth in km
    let dLat = deg2rad(lat2-lat1);  // deg2rad below
    let dLon = deg2rad(lon2-lon1);
    let a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    let d = R * c; // Distance in km
    return d;

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

  }


  loadMap() {
    // create a new map by passing HTMLElement
    let element: HTMLElement = document.getElementById('map');


    // create LatLng object
    let iniPos: LatLng = new LatLng(-23.58,43.3809802);

    let mapOptions = {
      'backgroundColor': 'white',
      'controls': {
        'compass': true,
        'myLocationButton': true,
        'indoorPicker': true,
        'zoom': true
      },
      'gestures': {
        'scroll': true,
        'tilt': true,
        'rotate': true,
        'zoom': true
      },
      'camera': {
        'latLng': iniPos,
        'tilt': 30,
        'zoom': 18,
        'bearing': 50
      }
    };


    this.map = this.googleMaps.create(element, mapOptions);

    // listen to MAP_READY event
    // You must wait for this event to fire before adding something to the map or modifying it in anyway
    this.map.one(GoogleMapsEvent.MAP_READY).then(
        () => {
          let markerOptions: MarkerOptions = {
            position: this.iniPos,
            title: 'Ionic'
          };

          this.map.addMarker(markerOptions).then(
              (marker: Marker) => {
                marker.showInfoWindow();
              }
          );

          this.map.getMyLocation().then(
              (myLoc : MyLocation) => {
                  this.map.moveCamera({
                  'target': myLoc.latLng,
                  'tilt': 30,
                  'zoom': 18,
                  'bearing': 0
                });

                  this.searchPlaces(myLoc.latLng, false);
              }
          );


          this.getLocations();

        }
    );




  }

  searchPlaces(myLoc, bg){
      let query = {
          type: 'bar',
          location: myLoc.toUrlValue(),
          rankby: 'distance',
          key: 'AIzaSyBXrel9dJS_qBVE3aQg-b59qNSkHRV8HvE'
      };

      this.http.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', query, {})
          .then(data => {

              let res = JSON.parse(data.data);
              for(let place of res.results){
                  let pos = new LatLng(place.geometry.location.lat, place.geometry.location.lng);

                  let iconColor = '#0fc509';
                  if(this.getDistance(pos,myLoc) < 0.7){
                      iconColor = '#f00';
                      this.notificator.schedule({
                          title: 'Tá Fervendo?',
                          text: 'Você está em ' + place.name + '?',
                          at: new Date(new Date().getTime() + 15000),
                          data: place.name
                      });
                  }

                  if(!bg){
                      let markerOptions: MarkerOptions = {
                          position: pos,
                          title: place.name,
                          icon: iconColor
                      };

                      this.map.addMarker(markerOptions).then(
                          (marker: Marker) => {
                              marker.showInfoWindow();
                          }
                      );
                  }

              }



          })
          .catch(error => {

              alert('Error:' + error.status);
              alert(error.error); // error message as string
              console.log(error.headers);

          });
  }







}
