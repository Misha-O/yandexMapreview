const myBalloon = document.querySelector(".balloon__card");
const closeButton = document.querySelector(".btn__close");
const addButton = document.querySelector(".btn__add");
const address = document.querySelector(".address");
const inputName = document.querySelector("#inputName");
const inputPlace = document.querySelector("#inputPlace");
const inputComment = document.querySelector("#inputComment");
const comments = document.querySelector(".balloon__comments");
const placemarks = []; // to use for cluster
let storage = localStorage; //for local storage
const storageArray = []; //to store all elements and fetch it if page reloaded

async function mapInit() {
  try {
    await new Promise((resolve, reject) => ymaps.ready(resolve));
    init();
  } catch (e) {
    console.log(e.message);
  }
}

mapInit();

function init() {
  let myAddress;
  let coordinates; //to access coordinates in all functions

  // map creation
  const myMap = new ymaps.Map("map", {
    // Center coords. By default: latitude, longitude
    center: [55.75, 37.61],
    // Scale level: from 0 (whole world) til 19.
    zoom: 13,
    controls: ["zoomControl", "searchControl"],
    behaviors: ["drag"],
  });

  // create cluster of placemarks
  const clusterer = new ymaps.Clusterer({
    preset: "islands#invertedNightClusterIcons",
    groupByCoordinates: false, // to group markers not only with same coords, but adjacent
    clusterDisableClickZoom: true, // turn off zoom on cluster click
    clusterHideIconOnBalloonOpen: false, // not to hide icon on click
    geoObjectHideIconOnBalloonOpen: false,
    clusterOpenBalloonOnClick: true, //to open balloon layout on click
    // design "carousel"
    clusterBalloonContentLayout: "cluster#balloonCarousel",
    clusterBalloonPanelMaxMapArea: 0,
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 250,
    clusterBalloonPagerSize: 10,
    clusterBalloonPagerType: "marker",
  });

  clusterer.add(placemarks);
  myMap.geoObjects.add(clusterer);

  // listen for map clicks

  myMap.events.add("click", (e) => {
    const coords = e.get("coords");
    coordinates = coords;

    comments.innerHTML = "No reviews yet...";

    // pop window with reviews and form
    openBalloon();

    // get address from click
    myAddress = getAddressByCoordinates(coords);
    getAddress(coords);
  });

  // create object with data from given coords
  function getAddressByCoordinates(coords) {
    return new ymaps.Placemark(coords);
  }

  // define address by coords (обратное геокодирование)
  function getAddress(coords) {
    ymaps.geocode(coords).then(function (resolve) {
      const firstGeoObject = resolve.geoObjects.get(0);

      myAddress.properties.set({
        // create  string with data from the object
        iconCaption: [
          // get the name of place or territory
          firstGeoObject.getLocalities().length
            ? firstGeoObject.getLocalities()
            : firstGeoObject.getAdministrativeAreas(),
          // receive the path of geographical object, if returned null, request name of the building
          firstGeoObject.getThoroughfare() || firstGeoObject.getPremise(),
        ],
        // set balloon content as a string of object address
        balloonContent: firstGeoObject.getAddressLine(),
      });
      // insert object address into window header
      address.innerText = firstGeoObject.getAddressLine();
    });
  }

  // with same dblclick if all inputs are entered, create date/time of review, receive address from prev func and create inside API Placemark custom markup from input fields

  addButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (inputName.value && inputPlace.value && inputComment.value) {
      // receive review address
      const addressLink = address.innerText;

      // create date
      const date = new Date();
      let year = date.getFullYear();
      let month = `${date.getMonth() + 1}`;
      let day = date.getDay();
      let hour = date.getHours();
      let minutes = date.getMinutes();
      let seconds = date.getSeconds();

      // if digit has one number add 0 infront

      if (month.length === 1) month = `0${month}`;
      if (day.length === 1) day = `0${day}`;
      if (hour.length === 1) hour = `0${hour}`;
      if (minutes.length === 1) minutes = `0${minutes}`;
      if (seconds.length === 1) seconds = `0${seconds}`;

      const currentTime = `${day}.${month}.${year} ${hour}:${minutes}:${seconds}`;

      // create placemark
      const newPlacemark = new ymaps.Placemark(
        coordinates,
        {
          balloonContentHeader: inputPlace.value,
          balloonContentBody: `${addressLink} ${inputComment.value}`,
          balloonContentFooter: currentTime,
        },
        {
          iconLayout: "default#image",
          iconImageHref: "./img/mapPinActive.png",
          iconImageSize: [30, 42],
          iconImageOffset: [-15, -42],
          draggable: false,
          openBalloonOnClick: false,
        }
      );

      // add placemark to cluster and to array placemarks
      myMap.geoObjects.add(newPlacemark);
      clusterer.add(newPlacemark);
      placemarks.push(newPlacemark);

      // reload content of balloon
      if (comments.innerHTML === "Отзывов пока нет...") {
        comments.innerHTML = "";
      }
      newPlacemark.commentContent = `<div><b>${inputName.value}</b>
        <b>${inputPlace.value}</b>
        <span>${currentTime}: </span><br>
        <span>${inputComment.value}</span></div><br>`;
      comments.innerHTML += newPlacemark.commentContent;
      newPlacemark.place = address.innerText;

      // saves inputs to local Storage
      saveToLocalStorage(coordinates, inputName, inputPlace, inputComment);

      loadFromLocalStorage();
      // clear all fields of our balloon
      clearInputs();

      newPlacemark.events.add("click", () => {
        openBalloon();
        comments.innerHTML = newPlacemark.commentContent;
        address.innerText = newPlacemark.place;
      });
    } else {
      alert("Please fill up all the fields !");
    }
  });
}

// close balloon
closeButton.addEventListener("click", () => {
  myBalloon.style.display = "none";
  clearInputs();
});

function clearInputs() {
  inputName.value = "";
  inputPlace.value = "";
  inputComment.value = "";
}

//placement if balloon and display change setting
function openBalloon() {
  myBalloon.style.top = event.clientY + "px";
  myBalloon.style.left = event.clientX + "px";
  myBalloon.style.display = "block";
}

function saveToLocalStorage(coordinates, inputName, inputPlace, inputComment) {
  const myData = {
    coordinates,
    review: {
      inputName: inputName.value,
      inputPlace: inputPlace.value,
      inputComment: inputComment.value,
    },
  };
  storage.data = JSON.stringify(myData);
}

function loadFromLocalStorage() {
  const myData = JSON.parse(storage.data);

  const dataToUpload = {
    coordinates: myData.coordinates,
    inputName: myData.review.inputName,
    inputPlace: myData.review.inputPlace,
    inputComment: myData.review.inputComment,
  };
  if (storageArray.length >= 0) {
    storageArray.push(dataToUpload);

    storageArray.forEach((elem) => {
      console.log("this is elem: ", elem);
      const marker = new ymaps.Placemark(
        elem.coordinates,
        {
          balloonContentHeader: elem.inputName,
          balloonContentBody: elem.inputPlace,
          balloonContentFooter: elem.inputComment,
        },
        {
          iconLayout: "default#image",
          iconImageHref: "./img/mapPinActive.png",
          iconImageSize: [30, 42],
          iconImageOffset: [-15, -42],
          draggable: false,
          openBalloonOnClick: false,
        }
      );

      clusterer.add(marker);
      placemarks.push(marker);
      myMap.geoObjects.add(marker);
    });
  }
}
