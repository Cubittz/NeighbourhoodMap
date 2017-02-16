//var googlePlacesUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=53.139,-1.55&radius=1500&type=restaurant&key=AIzaSyDgskGYx4SlVQAXvhC3T_eWIZpHIrMabPw"
var CLIENT_ID = 'IAEI3UW22HFDWDRJTFACXTHNTONSUEBJ5SUAOGQ3GNZHGFBJ';
var CLIENT_SECRET = 'ENP0YSSI3CTW52DMSO1QN5O4IN5FAPCCABGB4MEHV5AFRGYH';
var fourSquareUrl = 'https://api.foursquare.com/v2/venues/explore?ll=53.139,-1.55&radius=2500'
    + '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
    + '&v=20170216&m=foursquare&query=pub'

var Pub = function(data) {
    var pub = this;
    pub.id = ko.observable(data.venue.id)
    pub.name = ko.observable(data.venue.name);
    pub.lat = ko.observable(data.venue.location.lat);
    pub.lng = ko.observable(data.venue.location.lng);
    // address elements as not many venues have formatted address
    pub.address1 = ko.observable();
    pub.address2 = ko.observable();
    pub.address = ko.computed(function() {
        return pub.address1() + ', ' + pub.address2() ;
    });
    // pub photo
    pub.photoPrefix = ko.observable();
    pub.photoSuffix = ko.observable();
    pub.image = ko.computed(function() {
        return pub.photoPrefix() + '110x110' + pub.photoSuffix();
    })
    // google maps marker and infowindow
    pub.marker = ko.observable();
    pub.infowindow = ko.computed(function() {
        return "<div><h4>" + pub.name() + "</h4><img height='110' width='110' src='" + pub.image() + "' alt='Photo of Pub'></div>";
    })
};

var ViewModel = function() {
    var self = this;

    // Create initial observable array of attractions
    self.pubList = ko.observableArray([]);
    // retrieve data from google
    $.getJSON(fourSquareUrl, function(data) {
        pubsFromFoursquare = data.response.groups[0].items;
        pubsFromFoursquare.forEach(function(pub) {
            self.pubList.push(new Pub(pub));
        });
        var marker;
        var infowindow = new google.maps.InfoWindow({
            maxWidth: 400,
        });
        self.pubList().forEach(function(pub) {
            // get detailed foursquare info
            var venueUrl = 'https://api.foursquare.com/v2/venues/' + pub.id() + '?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=20170216&m=foursquare';
            $.getJSON(venueUrl, function(data) {
                pubInfo = data.response.venue;
                pub.address1(pubInfo.location.formattedAddress[0]);
                pub.address2(pubInfo.location.formattedAddress[1]);
                pub.photoPrefix(pubInfo.bestPhoto.prefix);
                pub.photoSuffix(pubInfo.bestPhoto.suffix);

                // add google pin marker to map for each pub
                marker = new google.maps.Marker({
                    position: new google.maps.LatLng(pub.lat(), pub.lng()),
                    map: map,
                    animation: google.maps.Animation.DROP
                });

                pub.marker(marker);
                // add animation to markers when clicked
                google.maps.event.addListener(pub.marker(), 'click', function() {
                    pub.marker().setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function() {
                        pub.marker().setAnimation(null);
                    }, 1400);
                    infowindow.setContent(pub.infowindow());
                    infowindow.open(map, this);
                })
                // push all restaurants out to filteredRestaurant array for initial load
                self.filteredPubs.push(pub);
            });

        })
    });

    // function to simulate clicking on marker when item clicked in list
    self.selectPub = function(pub) {
        google.maps.event.trigger(pub.marker(), 'click');
    }

    // set up search functionality
    self.query = ko.observable();
    self.filteredPubs = ko.observableArray();

    // function to update restaurantList when user enters a search
    self.runFilter = function() {
        var filter = self.query().toLowerCase();
        self.filteredPubs.removeAll();
        self.pubList().forEach(function(pub) {
            pub.marker().setMap(null);
            if(pub.name().toLowerCase().indexOf(filter) >= 0) {
                self.filteredPubs.push(pub);
            }
        });
        self.filteredPubs().forEach(function(pub) {
            pub.marker().setMap(map);
        });
    };
    // subscribe the search query to the runFilter function
    self.query.subscribe(self.runFilter);
}

// Load Google Maps and kick off ViewModel
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 53.129, lng: -1.55},
        zoom: 14
    });
    ko.applyBindings(new ViewModel());
}
