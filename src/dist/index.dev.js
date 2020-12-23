"use strict";

require("./css/style.css");

var _modal = _interopRequireDefault(require("./template/modal.hbs"));

var _reviews = _interopRequireDefault(require("./template/reviews.hbs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

ymaps.ready(init);

function init() {
  var create = document.querySelector(".create");
  var storage = localStorage; //for local storage

  var data;
  var myAddress;
  var coordinates;
  var storageArray = []; //to store all elements and fetch it if page reloaded

  var customBaloonLayout = ymaps.templateLayoutFactory.createClass("<div class=\"baloon-container\">\n      <div class=\"baloon-container__top\">\n      <div class=\"ballon_place balloon--created\"><strong>{{ properties.reviews.place|raw }}</strong></div>\n      <a href=\"#\" id=\"links\" class=\"ballon_address balloon--created\">{{ properties.addressReview|raw }}</a>\n      <div class=\"ballon_area balloon--created\">{{ properties.reviews.area|raw }}</div>\n      </div>\n      <span class=\"ballon_time balloon--created\">{{ properties.date|raw }}</span>\n      </div>", {
    build: function build() {
      customBaloonLayout.superclass.build.call(this);
      document.querySelector("#links").addEventListener("click", this.onCounterClick);
    },
    clear: function clear() {
      document.querySelector("#links").removeEventListener("click", this.onCounterClick);
      customBaloonLayout.superclass.clear.call(this);
    },
    onCounterClick: function onCounterClick(e) {
      e.preventDefault();
      var p = findName(e.target.previousElementSibling.textContent);
      reviewModal(e.target.textContent, p);
      eachLi(e.target.textContent);
      myMap.balloon.close();
    }
  });

  try {
    data = JSON.parse(storage.data);
  } catch (e) {
    data = undefined;
  }

  var myMap = new ymaps.Map("maps", {
    center: [55.75, 37.61],
    zoom: 13,
    controls: ["zoomControl", "searchControl"],
    behaviors: ["drag"]
  });
  myMap.events.add("click", function (e) {
    if (create.innerHTML != "") {
      create.innerHTML = "";
      getModal(e);
    } else {
      getModal(e);
    }
  });

  function getModal(e) {
    var coords = e.get("coords");
    ymaps.geocode(coords).then(function (res) {
      var firstGeoObject = res.geoObjects.get(0);
      return firstGeoObject.getAddressLine();
    }).then(function (address) {
      reviewModal(address, coords);
    });
  }

  function findName(place) {
    var storageItems = clusterer.getGeoObjects();
    var t;
    storageItems.forEach(function (obj) {
      if (place == obj.properties._data.reviews.place) {
        t = obj.geometry._coordinates;
      }
    });
    return t;
  }

  function createPlacemark(coords, address, arrRev, archivedDate) {
    // create date
    var date = new Date();
    var year = String(date.getFullYear());
    var month = String(date.getMonth()).padStart(2, 0);
    var day = String(date.getDay());
    var reviewTime = "".concat(day, ".").concat(month, ".").concat(year);
    var currentTime;

    if (archivedDate == undefined) {
      currentTime = reviewTime;
    } else {
      currentTime = archivedDate;
    }

    var mark = new ymaps.Placemark(coords, {
      addressReview: address,
      reviews: arrRev,
      date: currentTime
    }, {
      iconLayout: "default#image",
      iconImageHref: "./src/img/mapPinActive.png",
      iconImageSize: [24, 36],
      iconImageOffset: [-12, -36],
      draggable: false,
      openBalloonOnClick: false
    }); // localStorage

    storageArray.push({
      coord: coords,
      address: address,
      review: arrRev,
      date: currentTime
    }); // gets data adds to geoObject

    storage.data = JSON.stringify(storageArray);
    myMap.geoObjects.add(mark);
    clusterer.add(mark);
    return mark;
  } //   modal appears at exact place


  function reviewModal(address, coords) {
    create.innerHTML = (0, _modal["default"])({
      position: address
    });
    myAddress = address;
    coordinates = coords;
    var df = document.querySelector(".review-container__header");
    df.addEventListener("mousedown", function (e) {
      e.preventDefault();
      var dragElem = create;
      dragElem.style.position = "absolute";
      var coords = getCoords(dragElem);
      var shiftX = event.pageX - coords.left;
      var shiftY = event.pageY - coords.top;
      moveAt(event.pageX, event.pageY);

      function moveAt(pageX, pageY) {
        dragElem.style.left = pageX - shiftX + "px";
        dragElem.style.top = pageY - shiftY + "px";
      }

      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }

      document.addEventListener("mousemove", onMouseMove);

      dragElem.onmouseup = function () {
        document.removeEventListener("mousemove", onMouseMove);
        dragElem.onmousemove = null;
        dragElem.onmouseup = null;
      };

      document.oncontextmenu = cmenu;

      function cmenu() {
        return;
      }

      function getCoords(elem) {
        var box = elem.getBoundingClientRect();
        return {
          top: box.top + pageYOffset,
          left: box.left + pageXOffset
        };
      }
    });
  }

  create.addEventListener("click", function (e) {
    // create date
    var date = new Date();
    var year = String(date.getFullYear());
    var month = String(date.getMonth()).padStart(2, 0);
    var day = String(date.getDay());
    var hour = String(date.getHours()).padStart(2, 0);
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var reviewTime = "".concat(day, ".").concat(month, ".").concat(year, "  ").concat(hour, ":").concat(minutes, ":").concat(seconds);

    if (e.target.className == "close-reviews") {
      create.innerHTML = "";
    } else if (e.target.className == "i-btn") {
      createPlacemark(coordinates, myAddress, {
        name: document.querySelector(".i-name").value,
        place: document.querySelector(".i-place").value,
        area: document.querySelector(".i-area").value,
        dateModal: reviewTime
      });
      document.querySelector(".i-name").value = "";
      document.querySelector(".i-place").value = "";
      document.querySelector(".i-area").value = "";
      eachLi(myAddress);
    }
  });

  function eachLi(address) {
    var storageItems = clusterer.getGeoObjects();
    var arrTemp = new Array();
    storageItems.forEach(function (obj) {
      if (address == obj.properties._data.addressReview) {
        arrTemp.push(obj.properties._data.reviews);
      }
    });
    document.querySelector(".reviews").innerHTML = (0, _reviews["default"])(arrTemp);
  }

  myMap.geoObjects.events.add("click", function (e) {
    var target = e.get("target");

    if (target.properties._data.geoObjects) {} else {
      reviewModal(target.properties._data.addressReview, e.get("coords"));
      eachLi(target.properties._data.addressReview);
    }
  });
  var clusterer = new ymaps.Clusterer({
    preset: "islands#invertedNightClusterIcons",
    groupByCoordinates: false,
    // to group markers not only with same coords, but adjacent
    clusterDisableClickZoom: true,
    // turn off zoom on cluster click
    clusterHideIconOnBalloonOpen: false,
    // not to hide icon on click
    clusterOpenBalloonOnClick: true,
    //to open balloon layout on click
    clusterBalloonContentLayout: "cluster#balloonAccordion",
    clusterBalloonItemContentLayout: customBaloonLayout,
    clusterBalloonPanelMaxMapArea: 0,
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 130,
    clusterBalloonPagerSize: 10,
    clusterBalloonPagerType: "marker"
  });
  myMap.geoObjects.add(clusterer);

  if (data) {
    data.forEach(function (thismark) {
      createPlacemark(thismark.coord, thismark.address, thismark.review, thismark.date);
    });
  }
}