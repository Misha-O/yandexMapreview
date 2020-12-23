import "./css/style.css";
import hbsModal from "./template/modal.hbs";
import hbsReview from "./template/reviews.hbs";

ymaps.ready(init);

function init() {
  const create = document.querySelector(".create");
  let storage = localStorage; //for local storage
  let data;
  let myAddress;
  let coordinates;
  let storageArray = []; //to store all elements and fetch it if page reloaded

  const customBaloonLayout = ymaps.templateLayoutFactory.createClass(
    `<div class="baloon-container">
      <div class="baloon-container__top">
      <div class="ballon_place balloon--created"><strong>{{ properties.reviews.place|raw }}</strong></div>
      <a href="#" id="links" class="ballon_address balloon--created">{{ properties.addressReview|raw }}</a>
      <div class="ballon_area balloon--created">{{ properties.reviews.area|raw }}</div>
      </div>
      <span class="ballon_time balloon--created">{{ properties.date|raw }}</span>
      </div>`,
    {
      build: function () {
        customBaloonLayout.superclass.build.call(this);
        document
          .querySelector("#links")
          .addEventListener("click", this.onCounterClick);
      },
      clear: function () {
        document
          .querySelector("#links")
          .removeEventListener("click", this.onCounterClick);
        customBaloonLayout.superclass.clear.call(this);
      },
      onCounterClick: function (e) {
        e.preventDefault();
        let p = findName(e.target.previousElementSibling.textContent);
        reviewModal(e.target.textContent, p);
        eachLi(e.target.textContent);
        myMap.balloon.close();
      },
    }
  );
  try {
    data = JSON.parse(storage.data);
  } catch (e) {
    data = undefined;
  }
  const myMap = new ymaps.Map("maps", {
    center: [55.75, 37.61],
    zoom: 13,
    controls: ["zoomControl", "searchControl"],
    behaviors: ["drag"],
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
    let coords = e.get("coords");
    ymaps
      .geocode(coords)
      .then(function (res) {
        let firstGeoObject = res.geoObjects.get(0);
        return firstGeoObject.getAddressLine();
      })
      .then((address) => {
        reviewModal(address, coords);
      });
  }
  function findName(place) {
    let storageItems = clusterer.getGeoObjects();
    let t;

    storageItems.forEach((obj) => {
      if (place == obj.properties._data.reviews.place) {
        t = obj.geometry._coordinates;
      }
    });
    return t;
  }

  function createPlacemark(coords, address, arrRev, archivedDate) {
    // create date
    const date = new Date();
    let year = String(date.getFullYear());
    let month = String(date.getMonth()).padStart(2, 0);
    let day = String(date.getDay());
    const reviewTime = `${day}.${month}.${year}`;

    let currentTime;
    if (archivedDate == undefined) {
      currentTime = reviewTime;
    } else {
      currentTime = archivedDate;
    }
    let mark = new ymaps.Placemark(
      coords,
      {
        addressReview: address,
        reviews: arrRev,
        date: currentTime,
      },
      {
        iconLayout: "default#image",
        iconImageHref: "./src/img/mapPinActive.png",
        iconImageSize: [24, 36],
        iconImageOffset: [-12, -36],
        draggable: false,
        openBalloonOnClick: false,
      }
    );
    // localStorage
    storageArray.push({
      coord: coords,
      address: address,
      review: arrRev,
      date: currentTime,
    });
    // gets data adds to geoObject
    storage.data = JSON.stringify(storageArray);
    myMap.geoObjects.add(mark);
    clusterer.add(mark);

    return mark;
  }
  //   modal appears at exact place
  function reviewModal(address, coords) {
    create.innerHTML = hbsModal({ position: address });
    myAddress = address;
    coordinates = coords;
    const df = document.querySelector(".review-container__header");
    df.addEventListener("mousedown", (e) => {
      e.preventDefault();
      let dragElem = create;
      dragElem.style.position = "absolute";
      let coords = getCoords(dragElem);
      let shiftX = event.pageX - coords.left;
      let shiftY = event.pageY - coords.top;

      moveAt(event.pageX, event.pageY);
      function moveAt(pageX, pageY) {
        dragElem.style.left = pageX - shiftX + "px";
        dragElem.style.top = pageY - shiftY + "px";
      }
      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }
      document.addEventListener("mousemove", onMouseMove);
      dragElem.onmouseup = () => {
        document.removeEventListener("mousemove", onMouseMove);
        dragElem.onmousemove = null;
        dragElem.onmouseup = null;
      };
      document.oncontextmenu = cmenu;
      function cmenu() {
        return;
      }
      function getCoords(elem) {
        let box = elem.getBoundingClientRect();
        return {
          top: box.top + pageYOffset,
          left: box.left + pageXOffset,
        };
      }
    });
  }
  create.addEventListener("click", (e) => {
    // create date
    const date = new Date();
    let year = String(date.getFullYear());
    let month = String(date.getMonth()).padStart(2, 0);
    let day = String(date.getDay());
    let hour = String(date.getHours()).padStart(2, 0);
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    const reviewTime = `${day}.${month}.${year}  ${hour}:${minutes}:${seconds}`;

    if (e.target.className == "close-reviews") {
      create.innerHTML = "";
    } else if (e.target.className == "i-btn") {
      createPlacemark(coordinates, myAddress, {
        name: document.querySelector(".i-name").value,
        place: document.querySelector(".i-place").value,
        area: document.querySelector(".i-area").value,
        dateModal: reviewTime,
      });
      document.querySelector(".i-name").value = "";
      document.querySelector(".i-place").value = "";
      document.querySelector(".i-area").value = "";
      eachLi(myAddress);
    }
  });

  function eachLi(address) {
    let storageItems = clusterer.getGeoObjects();
    let arrTemp = new Array();
    storageItems.forEach((obj) => {
      if (address == obj.properties._data.addressReview) {
        arrTemp.push(obj.properties._data.reviews);
      }
    });
    document.querySelector(".reviews").innerHTML = hbsReview(arrTemp);
  }
  myMap.geoObjects.events.add("click", function (e) {
    const target = e.get("target");
    if (target.properties._data.geoObjects) {
    } else {
      reviewModal(target.properties._data.addressReview, e.get("coords"));
      eachLi(target.properties._data.addressReview);
    }
  });

  let clusterer = new ymaps.Clusterer({
    preset: "islands#invertedNightClusterIcons",
    groupByCoordinates: false, // to group markers not only with same coords, but adjacent
    clusterDisableClickZoom: true, // turn off zoom on cluster click
    clusterHideIconOnBalloonOpen: false, // not to hide icon on click
    clusterOpenBalloonOnClick: true, //to open balloon layout on click
    clusterBalloonContentLayout: "cluster#balloonAccordion",
    clusterBalloonItemContentLayout: customBaloonLayout,
    clusterBalloonPanelMaxMapArea: 0,
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 130,
    clusterBalloonPagerSize: 10,
    clusterBalloonPagerType: "marker",
  });
  myMap.geoObjects.add(clusterer);
  if (data) {
    data.forEach((thismark) => {
      createPlacemark(
        thismark.coord,
        thismark.address,
        thismark.review,
        thismark.date
      );
    });
  }
}
