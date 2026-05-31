
	function initialize() {
    var myLatlng = new google.maps.LatLng(22.8167,89.5500);
    var mapOptions = {
      zoom: 17,
      center: myLatlng,
      scrollwheel: false,
    };

    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    var contentString = '<div class="map-content-info" style="float:left;width:240px;padding:10px 0px 10px 0px;overflow:hidden;text-align:center">'+
                  '<div class="map-heading" style="float:left;width:100%;">'+
                    '<h3 style="margin:0px;padding:3px 0px 3px 0px;">Fitness Pro</h3>'+
                  '</div>'+
                  '<div class="map-address" style="float:left;width:100%;">'+
                    '<p style="margin:0px;padding:3px 0px 3px 0px;">Improve You Fitness Level.</p>'+
                  '</div>'+
                '</div>';

    ;

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var image = 'assets/images/ft-marker.png';
   
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      icon: image
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map,marker);
    });
  }

  google.maps.event.addDomListener(window, 'load', initialize);
	
