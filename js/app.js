var CLIENT_ID = 'IAEI3UW22HFDWDRJTFACXTHNTONSUEBJ5SUAOGQ3GNZHGFBJ';
var CLIENT_SECRET = 'ENP0YSSI3CTW52DMSO1QN5O4IN5FAPCCABGB4MEHV5AFRGYH';
var fourSquareUrl = 'https://api.foursquare.com/v2/venues/explore?ll=53.139,-1.55&radius=2500'
    + '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
    + '&v=20170216&m=foursquare&query=pub';
//model
var Pub = function(data) {
    var pub = this;
    pub.id = ko.observable(data.venue.id)
    pub.name = ko.observable(data.venue.name);
    pub.lat = ko.observable(data.venue.location.lat);
    pub.lng = ko.observable(data.venue.location.lng);
    pub.description = ko.observable('');
    pub.phone = ko.observable('');
    pub.rating = ko.observable('N/A');
    pub.price = ko.observable('');
    pub.canonicalUrl = ko.observable('');
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
        var contentString = '<div id="iw-container">' +
                                '<div class="iw-title">' + pub.name() + '</div>' +
                                '<div class="iw-content">' +
                                    '<div class="iw-subTitle">Details from Foursquare</div>' +
                                    '<img src="' + pub.photoPrefix() + '110x110' + pub.photoSuffix() + '" alt="Pub Photo">' +
                                    '<p>' + pub.phone() + '</p>' +
                                    '<p>' + pub.address() + '</p>' +
                                    '<p>' + pub.description() + '</p>' +
                                    '<p>Rating: ' + pub.rating() + '</p>' +
                                    '<p>Price: ' + pub.price() + '</p>' +
                                    '<p><a target="_blank" href=' + pub.canonicalUrl() + '>Look me up on Foursquare</a></p>' +
                                '</div>' +
                            '</div>';
        return contentString;
    })
};
//viewmodel
var ViewModel = function() {
    var self = this;

    // Create initial observable array of attractions
    self.pubList = ko.observableArray([]);
    // retrieve data from google
    $.getJSON(fourSquareUrl, function(data) {
        pubsFromFoursquare = data.response.groups[0].items;
    })
    .done(function() {
        pubsFromFoursquare.forEach(function(pub) {
            self.pubList.push(new Pub(pub));
        });
        var marker;
        var infowindow = new google.maps.InfoWindow();
        self.pubList().forEach(function(pub) {
            // get detailed foursquare info
            var venueUrl = 'https://api.foursquare.com/v2/venues/' + pub.id() + '?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=20170216&m=foursquare';
            $.getJSON(venueUrl, function(data) {
                pubInfo = data.response.venue;
            })
            .done(function() {
                if(pubInfo.contact.hasOwnProperty('formattedPhone')) {
                    pub.phone(pubInfo.contact.formattedPhone);
                };
                pub.address1(pubInfo.location.formattedAddress[0]);
                pub.address2(pubInfo.location.formattedAddress[1]);
                pub.photoPrefix(pubInfo.bestPhoto.prefix);
                pub.photoSuffix(pubInfo.bestPhoto.suffix);
                if(pubInfo.hasOwnProperty('description')) {
                    pub.description(pubInfo.description);
                };
                if(pubInfo.price.hasOwnProperty('message')) {
                    pub.price(pubInfo.price.message);
                };
                if(pubInfo.hasOwnProperty('rating')) {
                    pub.rating(pubInfo.rating);
                };
                if(pubInfo.hasOwnProperty('canonicalUrl')) {
                    pub.canonicalUrl(pubInfo.canonicalUrl);
                };
            })
            .fail(function() {
                var $error = $('#error');
                $error.html("Error Loading Venue Detail from FourSquare");
                $error.addClass("show-error");
            })
            .always(function(){
                // add google pin marker to map for each pub
                marker = new google.maps.Marker({
                    position: new google.maps.LatLng(pub.lat(), pub.lng()),
                    map: map,
                    animation: google.maps.Animation.DROP
                });

                pub.marker(marker);
                // add animation to markers when clicked
                google.maps.event.addListener(pub.marker(), 'click', function() {
                    map.panTo(pub.marker().getPosition());
                    pub.marker().setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function() {
                        pub.marker().setAnimation(null);
                    }, 1400);
                    infowindow.setContent(pub.infowindow());
                    infowindow.open(map, this);
                });
                // push all restaurants out to filteredRestaurant array for initial load
                self.filteredPubs.push(pub);
            });
        })
    })
    .fail(function() {
        var $error = $('#error');
        $error.html("Error Loading Data from FourSquare");
        $error.addClass("show-error");
    });

    // function to simulate clicking on marker when item clicked in list
    self.selectPub = function(pub) {
        google.maps.event.trigger(pub.marker(), 'click');
        // collapse sidebar after selection for mobile devices
        $('.navbar-collapse').collapse('toggle');
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
