var restaurantsFromGoogle = [];
var googlePlacesUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=53.139,-1.55&radius=1500&type=restaurant&key=AIzaSyDgskGYx4SlVQAXvhC3T_eWIZpHIrMabPw"


var Restaurant = function(data) {
    var restaurant = this;
    restaurant.name = ko.observable(data.name);
    restaurant.address = ko.observable(data.vicinity);
    restaurant.lat = ko.observable(data.geometry.location.lat);
    restaurant.lng = ko.observable(data.geometry.location.lng);
    restaurant.marker = ko.observable();
}

var ViewModel = function() {
    var self = this;

    // Create initial observable array of attractions
    self.restaurantList = ko.observableArray([]);
    $.getJSON(googlePlacesUrl, function(data) {
        restaurantsFromGoogle = data.results;
        restaurantsFromGoogle.forEach(function(restaurant) {
            self.restaurantList.push(new Restaurant(restaurant));
        });
        var marker;
        self.restaurantList().forEach(function(restaurant) {
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(restaurant.lat(), restaurant.lng()),
                map: map,
                animation: google.maps.Animation.DROP
            })
            restaurant.marker = marker;
            google.maps.event.addListener(restaurant.marker, 'click', function() {
                restaurant.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    restaurant.marker.setAnimation(null);
                }, 1400);
            })
        })
    });
    // set up search functionality
    self.query = ko.observable('');
    self.search = function(value) {
        self.restaurantList.removeAll();
        restaurantsFromGoogle.forEach(function(restaurant) {
            if(restaurant.name.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                restaurant.marker.setMap(map);
                self.restaurantList.push(new Restaurant(restaurant));
            }
        });
    }
    self.query.subscribe(self.search);

    self.selectRestaurant = function(restaurant) {
        google.maps.event.trigger(restaurant.marker, 'click');
    }

}
// Load Google Maps
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.139, lng: -1.55},
        zoom: 15
    });
    ko.applyBindings(new ViewModel());
}
